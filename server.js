const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');
const server = http.createServer(app);
const io = new Server(server);
const fs = require('fs')
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

app.use(cors());
app.use(bodyParser.json());

const userSocketMap = {};

function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
        return {
            socketId,
            userName: userSocketMap[socketId],
        }
    })
}

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, userName }) => {
        userSocketMap[socket.id] = userName;
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId);

        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, { clients, userName, socketId: socket.id });
        })
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                userName: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
        socket.leave();
    });

});

// routes 
app.post('/compile', (req, res) => {
    const { code, language } = req.body;

    if (language === 'js') {
        const fileName = 'temp.js';
        fs.writeFileSync(fileName, code);

        // Run the JavaScript file using child_process
        const executionCommand = `node ${fileName}`;
        exec(executionCommand, (runError, runStdout, runStderr) => {
            if (runError) {
                res.send({ error: runError.message, output: runStderr });
            } else {
                res.send({ error: null, output: runStdout });
            }
            // Remove the temporary file after execution
            fs.unlinkSync(fileName);
        });
    } else if (language === 'cpp') {
        
        const outputDir = path.join(__dirname, 'compiled');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }

        // Write the C++ code to a file
        const fileName = path.join(outputDir, 'temp.cpp');
        fs.writeFileSync(fileName, code);

        // Compilation command to create temp.exe in the compiled directory
        const compilationCommand = `g++ ${fileName} -o ${path.join(outputDir, 'temp.exe')}`;

        exec(compilationCommand, (compileError, compileStdout, compileStderr) => {
            if (compileError) {
                
                res.status(500).send({ error: 'Compilation Error', message: compileError.message });
                return;
            }

            // Run the compiled executable from the compiled directory
            const executionCommand = `${path.join(outputDir, 'temp.exe')}`;
            exec(executionCommand, (runError, runStdout, runStderr) => {
                if (runError) {
                
                    res.status(500).send({ error: 'Execution Error', message: runError.message });
                    return;
                }
               
                res.send({ error: null, output: runStdout || runStderr });
            });
            
        });
    } else {
        res.status(400).send({ error: 'Unsupported language', message: 'The requested language is not supported.' });
    }
});


const PORT = process.env.port || 8000;
server.listen(PORT, () => {
    console.log('server started at 8000');
})