import React, { createContext, useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const SocketContext = createContext();
const socket = io('http://localhost:5000');

const ContextProvider = ({ children }) => {
    const [stream, setStream] = useState();
    const [me, setMe] = useState('');
    const [call, setCall] = useState({});
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [name, setName] = useState('')

    
    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();


    // used to populate the video object with the video data from the server and the video stream.

    useEffect(() => {
        //This returns a promise
        navigator.mediaDevices.getUserMedia({video: true, audio: true})
        .then((currentStream) => {
            setStream(currentStream);
            myVideo.current.srcObject = currentStream;
        });
        socket.on('me', (id) => setMe(id));

        socket.on('calluser', ({from, name: callerName, signal}) => {
            setCall({isRecievedCall: true, from, name:callerName, signal})
        });
    }, []);
    // This above useEffect needs to contain an empty dependency array at the end, else its always going to run

    const answerCall = () => {
        setCallAccepted(true);

        const peer = new Peer({ initiator:false, trickle: false, stream });
        peer.on('signal', (data) => {
            socket.emit('answercall', {signal: data, to: call.from});
        });
        peer.on('stream', (currentStream) => {
            userVideo.current.srcObject = currentStream; // stream for other user
        });
        peer.signal(call.signal);

        connectionRef.current = peer;
    }

    const callUser = (id) => {
        const peer = new Peer({ initiator:true, trickle: false, stream });

        peer.on('signal', (data) => {
            socket.emit('callUser', {userToCall: id, signalData: data, from: me, name});
        });
        peer.on('stream', (currentStream) => {
            userVideo.current.srcObject = currentStream; // stream for other user
        });

        socket.on('callaccepted', (signal) => {
            setCallAccepted(true);
            peer.signal(true);
        });
        connectionRef.current = peer;
    };

    const leaveCall = () => {
        setCallEnded(true);

        connectionRef.current.destroy();

        window.location.reload();
    }

    return(
        <SocketContext.Provider value={{
            call,
            myVideo,
            userVideo,
            stream,
            name,
            setName,
            callEnded,
            me,
            callUser,
            leaveCall,
            answerCall,
            callAccepted,
        }}>
            {children} 
            {/* all components will be inside the socket wrapped into it. This is the way for context to work */}
        </SocketContext.Provider>
    );
};
export { ContextProvider, SocketContext };
