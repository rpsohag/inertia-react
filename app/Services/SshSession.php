<?php

namespace App\Services;

use phpseclib3\Net\SSH2;

class SshSession
{
    public $ssh;

    public function __construct($host, $port, $user, $pass)
    {
        $this->ssh = new SSH2($host, $port);
        $this->ssh->login($user, $pass);
        $this->ssh->enablePTY();
        $this->ssh->exec("bash --login");
    }

    public function write($data)
    {
        $this->ssh->write($data);
        return $this->ssh->read();
    }
}
