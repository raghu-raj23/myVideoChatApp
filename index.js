const app = require("express")();
const server = require("http").createServer(app);
const cors = require("cors");

const io = require("socket.io")(server, {
    cors: {
        origin : "*", // This allows access from all origins
        methods: ["GET", "POST"]
    }
});

app.use(cors());

const PORT = process.env.PORT || 5000;

// Root route
app.get('/', (req, res) => {
    res.send('Server is running.');
});

io.on('connection',(socket) => {
    socket.emit('me', socket.id); // This will give the socket id of our connection.

    socket.on('disconnect', () => {
        socket.broadcast.emit("call ended");
    });

    socket.on("calluser", ({userToCall, signalData, from, name}) =>{
        io.to(userToCall).emit("calluser", {signal:signalData, from, name}); 
        // This will give the data to the frontend, about the user to call.
    });

    socket.on("answercall", (data) => {
        io.to(data.to).emit("call accepted", data.signal);
    });
});


server.listen(PORT, () => console.log(`Server is listening on port ${PORT}`));