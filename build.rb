cmd = "grunt"
pid = spawn(cmd)
Process.wait(pid)

cmd = "nw ."
spawn(cmd)