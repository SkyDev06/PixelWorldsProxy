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
var fs = require("fs");
var socket; // Getting Socket Data From Server

var host = "127.0.0.1"; // IP Host
var ip = "44.194.163.69" // IP Game
var port = 10001; // PORT Game && Host

function real_packet_logs(data) {
    fs.appendFileSync("logs.txt", data);
}

function bsonDec(data) {
    try {
        return bson.deserialize(data.slice(4), {
            allowObjectSmallerThanBufferSize: true,
            promoteBuffers: true
        });
    }
    catch (e) {}
}

function bsonEnc(json) {
    const data = bson.serialize(json);
    var buf = Buffer.alloc(4 + data.byteLength);
    buf.writeInt32LE(4 + data.byteLength);
    data.copy(buf, 4);
    return buf;
}

function ProcessPacket(data, type) {
    if (data == null || !data.hasOwnProperty("mc")) return data;
    var msgCount = data["mc"];
    for(let i = 0; i < msgCount; i++) {
        var current = data["m" + String(i)];
        var messageId = current["ID"];
        switch (messageId) {
            case "OoIP": // Subserver (Not Working For Now)
                var ip_subserver = current["IP"];
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
                console.log(`[CLIENT] MESSAGE ID: ${messageId} Data: ${String(JSON.stringify(data))}`)
            }
            else if (type == "SERVER") {
                console.log(`[SERVER] MESSAGE ID: ${messageId} Data: ${String(JSON.stringify(current))}`)
            }
        }
    }
}

function Proxy_Game(ip_) {
    proxy.connect(port, ip_, function() {
        console.log(`[PROXY] Connected To ${ip_}:${port}`);
    });

    // Proxy Data Handler
    proxy.on("data", function(data) {
        try {
            ProcessPacket(bsonDec(data), "CLIENT");
            socket.write(data); // Send To Server
            if (JSON.stringify(bsonDec(data)) != undefined) real_packet_logs(`[CLIENT] ${JSON.stringify(bsonDec(data))}\n`);
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
                if (JSON.stringify(bsonDec(data)) != undefined) real_packet_logs(`[SERVER] ${JSON.stringify(bsonDec(data))}\n`);
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
        Proxy_Game(ip);
    });
}

Host_Handler();
