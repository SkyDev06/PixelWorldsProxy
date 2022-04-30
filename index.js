/*
* Simple Proxy Pixel Worlds In NodeJS
* This Proxy By Adip(SkyDev)
* Help By KIPASGTS (Fix Packet Sender[ Client -> Server, Server -> Client ])
* Python Version: https://github.com/KIPASGTS/PixelWorldProxy
* Youtube: AdipYT, https://www.youtube.com/channel/UC8XJuoQzNfYa6sW7JcFb3Vw
* Github: SkyDev06, https://github.com/SkyDev06
* Help:
* Send Packet To Client Using socket.write(bsonEnc({ Json Data }));
* Packet Send To Server, And Server Send Packet To Client
*/

var net = require("net");
var proxy = new net.Socket();
var server = net.createServer();
var bson = require("bson");
var socket; // Getting Socket Data From Server

var host = "127.0.0.1"; // IP Host
var ip = "44.194.163.69" // IP Game
var port = 10001; // PORT Game && Host

function bsonDec(data) {
    return bson.deserialize(data.slice(4));
}

function bsonEnc(json) {
    const data = bson.serialize(json);
    var buf = Buffer.alloc(4 + data.byteLength);
    buf.writeInt32LE(4 + data.byteLength);
    data.copy(buf, 4);
    return buf;
}

function SBH(data) {
    try {
        var msgCount = data["mc"];
        for(let i = 0; i < msgCount; i++) {
            var current = data["m" + String(i)];
            var messageId = current["ID"];
            const logs = `[SERVER] MESSAGE ID: ${messageId} Data: ${String(JSON.stringify(current))}`;
            console.log(logs);
        }
    }
    catch (e) {
        console.log(`[SERVER] ${e}!`);
    }
}

function CBH(data) {
    try {
        var msgCount = data["mc"];
        for(let i = 0; i < msgCount; i++) {
            var current = data["m" + String(i)];
            var messageId = current["ID"];
            const logs = `[CLIENT] MESSAGE ID: ${messageId} Data: ${String(JSON.stringify(data))}`;
            console.log(logs);
        }
    }
    catch (e) {
        console.log(`[CLIENT] ${e}!`);
    }
}

function ProcessPacket(data, type) {
    var msgCount = data["mc"];
    for(let i = 0; i < msgCount; i++) {
        var current = data["m" + String(i)];
        var messageId = current["ID"];
        switch (messageId) {
            case "OoIP": // Subserver (Not Working For Now)
                var ip_subserver = current["IP"];
                if (ip_subserver) {
                    if (ip_subserver.includes("prod.gamev8")) {
                        ip_subserver = ip;
                    }
                    proxy.destroy();
                    proxy.connect(port, ip_subserver);
                }
                break;
            case "WCM":
                var msg = current["msg"];
                break;
            case "ST":
                // Ignore Packet
                break;
            case "p" || "mP":
                if (i == 1 || current.length == 1) {
                    // Ignore Packet
                    return;
                }
                break;
        }
        
        if (i > 0) {
            if (type == "CLIENT") {
                CBH(data);
            }
            else if (type == "SERVER") {
                SBH(data);
            }
            else {
                return;
            }
        }
    }
}

function Proxy_Game() {
    proxy.connect(port, ip, function() {
        console.log(`[PROXY] Connected To ${ip}:${port}`);
    });

    // Proxy Data Handler
    proxy.on("data", function(data) {
        try {
            ProcessPacket(bsonDec(data), "CLIENT");
            socket.write(data); // Send To Server
        }
        catch (e) {
            console.log(`[CLIENT] ${e}`);
        }
    });
}

function Host_Handler() {
    server.on("connection", function(sock) {
        socket = sock;
        sock.on("data", function(data) {
            try {
                ProcessPacket(bsonDec(data), "SERVER");
                proxy.write(data); // Send To Client
            }
            catch (e) {
                console.log(`[SERVER] ${e}`);
            }
        });
    })
    server.listen(port, host, function() {
        process.title = "Simple Pixel Worlds Proxy in NodeJS By Adip(SkyDev)";
        console.log(`[AUTHOR] Simple Pixel Worlds Proxy in NodeJS By Adip(SkyDev)`);
        console.log(`[SERVER] Server Listen ${host}:${port}`);

        // Proxy Game
        Proxy_Game(ip, port);
    });
}

Host_Handler();