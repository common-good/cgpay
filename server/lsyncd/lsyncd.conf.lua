settings {
  logfile = "/var/log/lsyncd/lsyncd.log",
  statusFile = "/var/log/lsyncd/lsyncd-status.log",
}

sync {
  default.rsync,
  source = "/home/main/cg/shared/",
  target = "{{SYNC_HOST}}:/home/main/cg/shared/",
  delay = 2,
  exclude = { "config/" },
  rsync = {
    binary = "/usr/bin/rsync",
    archive = true,
    compress = true,
    rsh = "/usr/bin/ssh",
    _extra = { "--omit-dir-times" }
  }
}

sync {
  default.rsync,
  source = "/home/main/pay/shared/web/",
  target = "{{SYNC_HOST}}:/home/main/pay/shared/web/",
  delay = 2,
  exclude = { "node_modules/" },
  rsync = {
    binary = "/usr/bin/rsync",
    archive = true,
    compress = true,
    rsh = "/usr/bin/ssh",
    _extra = { "--omit-dir-times" }
  }
}

sync {
  default.rsync,
  source = "/home/beta/pay/shared/web/",
  target = "{{SYNC_HOST}}:/home/beta/pay/shared/web/",
  delay = 2,
  exclude = { "node_modules/" },
  rsync = {
    binary = "/usr/bin/rsync",
    archive = true,
    compress = true,
    rsh = "/usr/bin/ssh",
    _extra = { "--omit-dir-times" }
  }
}
