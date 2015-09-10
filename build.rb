cmd = "grunt"
pid = spawn(cmd)
Process.wait(pid)

cmd = "electron ."
spawn(cmd)