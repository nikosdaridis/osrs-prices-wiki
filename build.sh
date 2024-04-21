#!/bin/sh
curl -sSL https://dot.net/v1/dotnet-install.sh > dotnet-install.sh
chmod +x dotnet-install.sh

./dotnet-install.sh -c 8.0 -InstallDir ./dotnet
./dotnet/dotnet --version

if ! command -v node &> /dev/null
then
    curl -sL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

node -v
npm -v

npm install -g typescript
tsc -v

./dotnet/dotnet publish -c Release -o output