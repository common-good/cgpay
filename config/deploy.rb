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
        running = capture(:pm2, 'jlist', raise_on_non_zero_exit: false).include?('"name":"pay"')
        if running
          execute :pm2, 'reload pay --update-env'
        else
          execute :pm2, "start build/index.js --name pay", env: { PORT: fetch(:pay_port) }
        end
      end
    end
  end

  after 'deploy:updated', 'deploy:build'
  after 'deploy:build', 'deploy:restart'
end