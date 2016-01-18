# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/trusty64"

  config.vm.network "forwarded_port", guest: 8080, host: 8080
  config.vm.network "forwarded_port", guest: 8000, host: 8000

  config.vm.provision "shell", inline: <<-SHELL
    sudo apt-get update -y
    sudo apt-get upgrade -y
    curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
    sudo apt-get install -y nodejs
    sudo apt-get install -y git default-jre
    sudo apt-get install -y redis-server
    sudo npm install -g express body-parser cookie-parser multer redis jade mocha chai sinon async aws-sdk eslint
    echo 'export NODE_PATH=$NODE_PATH:/usr/local/lib/node_modules' >> /home/vagrant/.bashrcc
    wget http://dynamodb-local.s3-website-us-west-2.amazonaws.com/dynamodb_local_latest.tar.gz -O /home/vagrant/dynamodb.tar.gz
    mkdir /home/vagrant/dynamodb
    tar -zxvf /home/vagrant/dynamodb.tar.gz -C /home/vagrant/dynamodb.tar.gz
  SHELL
end
