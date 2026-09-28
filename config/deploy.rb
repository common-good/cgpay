# config/deploy.rb
lock '~> 3.20.1'
set :application, 'cgpay'
set :repo_url, 'https://github.com/common-good/cgpay.git'
set :local_user, ENV['USER'] || ENV['USERNAME'] || `whoami`.chomp
stage0 = fetch(:stage).to_s   # whatever was typed after `cap`
set :stage, (stage = stage0.chomp("-standby"))
raise "No pay setup for stage '#{stage}'" unless %w[test dev staging demo beta main].include?(stage)
subdomain = stage0.include?("-standby") ? "standby" : stage 

case stage   # whatever was typed after `cap`
when "test"
  ask :branch, `git rev-parse --abbrev-ref HEAD`.chomp # defaults to current checked-out branch
when "dev"
  set :branch, "develop"
when "staging"
  ask :branch, "main"
when "main", "beta", "demo"
  ask :branch, "main"   # ask temporarily while getting set up
end

server "#{subdomain}.commongood.earth", roles: %w{app db web}, user: stage, port: 7822

set :deploy_to, "/home/#{stage}/pay"
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
        # environment. Explicit Ruby check instead, so the wrapper only ever
        # runs one simple command at a time.
        #
        # `--node-args="--env-file=..."` (Node 20.6+) loads the shared .env at
        # startup — pm2 doesn't do this itself, and SvelteKit's adapter-node
        # doesn't either. Without it, DB_*/JWT_SECRET/PHP_SSO_URL etc. are all
        # undefined at runtime and every login 401s.
        #
        # PORT is NOT passed via SSHKit's `env:` hash — confirmed (via `pm2 env`)
        # that it silently never reaches the process when combined with the
        # quoted --node-args argument above; exact interaction unclear, evidence
        # was unambiguous either way. Fix: PORT lives in .env itself instead,
        # loaded the same way as every other variable — see the .env generation
        # below, which now includes it.
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