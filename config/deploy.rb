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
set :nvm_node, 'v20.20.2'   # matches confirmed working instance
set :nvm_map_bins, %w[node npm pm2]

# Stage-qualified, e.g. "pay-main"/"pay-beta"/"pay-test" — not required for
# correctness (pm2 keeps a fully separate process list per Linux user, so
# every environment could share the literal name "pay" with zero collision;
# confirmed via each environment's own /home/<env>/.pm2/ directory). Purely
# for readability in `pm2 list`, log lines, and error emails, where a bare
# "pay" gives no hint which environment it came from.
set :pm2_process_name, "pay-#{fetch(:stage)}"

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
    # current_path, NOT release_path — this task is hooked to
    # `deploy:publishing` (below), which runs *after* Capistrano flips the
    # `current` symlink to the new release, so this always resolves to
    # whatever's actually live now. release_path (the original bug) meant
    # pm2 always started against that specific deploy's release directory —
    # and since pm2 resolves a script's path to its real, symlink-independent
    # absolute location the moment it first starts, the process stayed
    # pinned to that one release forever, regardless of anything deployed
    # since (confirmed live on this project: `pm2 show pay` showed a specific
    # releases/<timestamp>/... path months after subsequent deploys).
    within current_path.join('web') do
      # NOT `reload ... || start ...` as a single shell command — the
      # capistrano-nvm wrapper (nvm-exec.sh) loses PATH on the `||` fallback
      # half, causing "pm2: command not found" on first deploy to any
      # environment.
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
      #
      # ALWAYS delete-then-start — never a conditional "reload if already
      # running, start if not." That conditional was the second, more serious
      # bug on top of the release_path issue: since --env-file's path never
      # changes between deploys (it's the shared, not per-release, .env),
      # "already running with a matching --env-file" was true on every deploy
      # after the very first, so it always took the `reload` branch — which
      # just re-execs the already-pinned path, never the new release. Every
      # deploy after the first was a silent no-op until the pinned release
      # got pruned by deploy:cleanup and pm2 failed outright (confirmed: a
      # live 502).
      env_file = shared_path.join('web/.env')
      name = "pay-#{fetch(:stage)}"
      execute :pm2, "delete #{name}", raise_on_non_zero_exit: false
      execute :pm2, %Q{start build/index.js --name #{name} --node-args="--env-file=#{env_file}"}
    end
  end
end

  after 'deploy:updated', 'deploy:build'
  # `deploy:publishing`, NOT `deploy:build`/`deploy:updated` — those fire
  # *before* Capistrano flips the `current` symlink to the new release. With
  # the release_path→current_path fix above, restarting that early would
  # just point pm2 at the *previous* release, not the one just built.
  after 'deploy:publishing', 'deploy:restart'
end