#!/bin/bash
###########################
# Winnowing project setup #
###########################
apt update

apt install apache2

apt install libapache2-mod-php
apt install php
apt install python3
apt install python3-pip
apt install python3-tk
pip3 install argparse
pip3 install numpy
pip3 install matplotlib
pip3 install pandas
pip3 install networkx
pip3 install scipy
pip3 install minepy
pip3 install sklearn

systemctl restart apache2
systemctl status apache2

cd /var/www/html/
apt install git
git clone https://github.com/bhattigurjot/winnowing
cd winnowing/
git pull

###############
# View errors #
###############
# cd /var/log/apache2/
# nano errors.log

######################
# Upload size errors #
######################
# increase size limit in php.ini file in apache settings

##########################
# Permission error:      #
# In winnowing directory #
##########################
# chown -R www-data:www-data .