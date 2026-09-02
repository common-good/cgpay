# config/deploy.rb
lock '~> 3.20.1'
set :application, 'cgpay'
set :repo_url, 'git@github-pay:common-good/cgpay.git'
set :local_user, ENV['USER'] || ENV['USERNAME'] || `whoami`.chomp

case (stage = fetch(:stage).to_s)
when "test"
  ask :branch, `git rev-parse --abbrev-ref HEAD`.chomp
when "dev"
  set :branch, "develop"
when "staging"
  ask :branch, "main"
else # demo, beta, main
  set :branch, "main"
end

# beta and main are on the production server, so no conflicts (collisions) with the other ports
PAY_PORTS = { test: 3001, dev: 3002, staging: 3003, demo: 3004, beta: 3001, main: 3002 }
port = PAY_PORTS[stage.to_sym]
raise "No pay_port mapping for stage '#{stage}'" if port.nil?
set :pay_port, port

set :deploy_to, "/home/#{stage}/pay"
server "#{stage}.commongood.earth", roles: %w{app db web}, user: stage, port: 7822
set :tmp_dir, "/home/#{stage}/tmp"
set :ssh_options, {
  forward_agent: false,
  auth_methods: %w(publickey),
  user: stage,
  port: 7822
}

set :linked_dirs, %w[web/node_modules]
set :linked_files, %w[web/.env]
set :keep_releases, 5
set :nvm_type, :user
set :nvm_node, 'v20.20.2'   # matches Chris's confirmed working cgpay-poc instance
set :nvm_map_bins, %w[node npm pm2]

namespace :deploy do
  desc 'Install dependencies and build the SvelteKit app'
  task :build do
    on roles(:app) do
      within release_path.join('web') do
        execute :npm, 'ci'
        execute :npm, 'run build'
      end
    end
  end

  desc 'Restart the SvelteKit app via pm2'
  task :restart do
    on roles(:app) do
      within release_path.join('web') do
        # NOT `reload ... || start ...` as a single shell command — the
        # capistrano-nvm wrapper (nvm-exec.sh) loses PATH on the `||` fallback
        # half, causing "pm2: command not found" on first deploy to any
        # environment (confirmed on test). Explicit Ruby check instead, so the
        # wrapper only ever runs one simple command at a time.
        #
        # PORT must be passed on BOTH branches, not just `start` — a stale
        # process entry from an earlier deploy attempt caused `reload` to run
        # with no PORT set, so the app fell back to its own hardcoded default
        # (3000) and collided with an unrelated process already on that port
        # (confirmed on dev/staging).
        #
        # `--node-args="--env-file=..."` (Node 20.6+, we're on 20.20.2) tells the
        # node process to load the shared .env at startup — pm2 doesn't do this
        # itself, and SvelteKit's adapter-node doesn't either. Without it, the
        # process comes up with only PORT in its env; DB_*, PHP_SSO_URL,
        # JWT_SECRET, etc. are all undefined at runtime and every login 401s
        # because phpLookup can't reach the SSO endpoint. (Confirmed on test
        # before this fix.)
        #
        # pm2 stores node-args with the process on `start`, so subsequent
        # reloads preserve them. To transition an existing process that was
        # started WITHOUT --env-file, we detect the missing flag in the current
        # jlist and force a delete + fresh start once; subsequent deploys go
        # through the normal reload path.
        env_file = shared_path.join('web/.env')
        jlist = capture(:pm2, 'jlist', raise_on_non_zero_exit: false)
        running = jlist.include?('"name":"pay"')
        needs_fresh_start = !running || !jlist.include?("--env-file=#{env_file}")
        if needs_fresh_start
          execute :pm2, 'delete pay', raise_on_non_zero_exit: false if running
          execute :pm2, %Q{start build/index.js --name pay --node-args="--env-file=#{env_file}"}
        else
          execute :pm2, 'reload pay --update-env'
        end
      end
    end
  end

  after 'deploy:updated', 'deploy:build'
  after 'deploy:build', 'deploy:restart'
end