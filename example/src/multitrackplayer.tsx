import React, { useCallback, useRef, useState, useEffect } from 'react';

import {
  View,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView
} from 'react-native';
import { RTCPeerConnection, RTCIceCandidate, MediaStream, MediaStreamTrack } from 'react-native-webrtc';
import { useAntMedia, rtc_view } from '@antmedia/react-native-ant-media';

import InCallManager from 'react-native-incall-manager';

export default function MultiTrackPlayer() {
  var defaultRoomName = 'room1';
  const webSocketUrl = 'wss://abc.mustafa-boleken-ams-test.tech:5443/LiveApp/websocket';
  //or webSocketUrl: 'wss://server.com:5443/WebRTCAppEE/websocket',

  const [localMedia, setLocalMedia] = useState('');
  const [remoteStreams, setremoteStreams] = useState<any>([]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [roomId, setRoomId] = useState(defaultRoomName);
  const stream = useRef({ id: '' }).current;
  let roomTimerId: any = useRef(0).current;
  let streamsList: any = useRef([]).current;
  const [PlayStreamsListArr, updatePlayStreamsListArr] = useState<any>([]);

  let tracks: any = useRef([]).current;

  const adaptor = useAntMedia({
    url: webSocketUrl,
    mediaConstraints: {
      audio: true,
      video: false
    },
    callback(command: any, data: any) {
      console.log('*** command', command , ' -> data', data);
      switch (command) {
        // roomInformation ???
        case 'pong':
          break;
        case 'initialized':
          console.log('initialized');
          break;
        case 'play_started':
          setIsPlaying(true);
          //joined the stream
          console.log("play started");
          break;
        case 'play_finished':
          console.log('play_finished');
          // ? removeRemoteVideo(data.streamId);
          break;
        case 'closed':
          if (typeof data != "undefined") {
            console.log("Connecton closed: "
              + JSON.stringify(data));
          }
          break;
        case 'newStreamAvailable':
          console.log('***newStreamAvailable');
          //playVideo(data);
          break;
        case 'updated_stats':
          //obj is the PeerStats which has fields
          //averageIncomingBitrate - kbits/sec
          //currentIncomingBitrate - kbits/sec
          //packetsLost - total number of packet lost
          //fractionLost - fraction of packet lost
          console.log("Average incoming kbits/sec: " + data.averageIncomingBitrate
            + " Current incoming kbits/sec: " + data.currentIncomingBitrate
            + " packetLost: " + data.packetsLost
            + " fractionLost: " + data.fractionLost);
          break;
        case 'trackList':
          console.log('trackList', data.streamId, data.trackList);
          //addTrackList(data.streamId, data.trackList);
          break;
        default:
          break;
      }
    },
    callbackError: (err: any, data: any) => {
      console.error('callbackError', err, data);
    },
    peer_connection_config: {
      'iceServers' : [ {
        'urls' : 'stun:stun1.l.google.com:19302'
      } ],
      sdpSemantics: 'unified-plan'
    },
    isPlayMode: true,
    onlyDataChannel: false,
    debug: true,
  });

  useEffect(() => {
    const remoteStreamArr: any = [];

    if (adaptor && Object.keys(adaptor.remoteStreamsMapped).length > 0) {
      for (let i in adaptor.remoteStreamsMapped) {
        let st =
          adaptor.remoteStreamsMapped[i] &&
          'toURL' in adaptor.remoteStreamsMapped[i]
            ? adaptor.remoteStreamsMapped[i].toURL()
            : null;

        if (PlayStreamsListArr.includes(i)) {
          if (st) remoteStreamArr.push(st);
        }
      }
    }

    setremoteStreams(remoteStreamArr);
  }, [adaptor.remoteStreamsMapped]);

  function addTrackList(streamId: any, trackList: any) {
    addVideoTrack(streamId);
    //setremoteStreams(trackList)
    trackList.forEach(function(trackId: any) {
      addVideoTrack(trackId);
    });
  }

  function addVideoTrack(trackId: any) {
    tracks.push(trackId);
  }

  function playVideo(obj: any) {
    console.log("****** newStreamAvailable: " + JSON.stringify(obj));
    /*
    console.log("new stream available with id: "
      + obj.streamId + "on the room:" + roomId);

    let index1;
    if(obj.track.kind == "video") {
      index1 = obj.track.id.replace("ARDAMSv", "");
    }
    else if(obj.track.kind == "audio") {
      index1 = obj.track.id.replace("ARDAMSa", "");
    }

    if(index1 == roomId) {
      return;
    }

    var video = document.getElementById("remoteVideo"+index1);

    if (video == null) {
      createRemoteVideo(index);
      video = document.getElementById("remoteVideo"+index1);
      video.srcObject = new MediaStream();
    }

    video.srcObject.addTrack(obj.track)

    obj.track.onended = event => {
      video.srcObject.removeTrack(event.currentTarget);
      if(video.srcObject.getTracks().length == 0) {
        removeRemoteVideo(index);
      }
    };

     */
  }

  function removeRemoteVideo(streamId: any) {
    const remoteStreamArr: any = [];

    remoteStreams.forEach((stream: any, index: any) => {
      if (index !== streamId) {
        remoteStreamArr.push(stream);
      }
    });
    //setremoteStreams(remoteStreamArr);
  }

  function startPlaying() {
    let enabledTracks: string[] = [];
    tracks = ['sZABRzdBNXBnUeAy','zJiaikLBnvoSRghh'];
    tracks.forEach(function(trackId: string) {
      enabledTracks.push("" + trackId);
    });

    adaptor.play(roomId, undefined, "", enabledTracks);
    //adaptor.play(roomId, undefined, "", []);
  }

  function stopPlaying() {
    adaptor.stop(roomId);
    setIsPlaying(false);
  }


  function getTracks() {
    adaptor.getTracks(roomId, "");
    setremoteStreams(adaptor.remoteStreamsMapped);
  }

  const getRemoteStreams = () => {
    const remoteStreamArr: any = [];

    console.log("BOLA ->", Object.keys(adaptor.remoteStreamsMapped).length);
    if (adaptor && Object.keys(adaptor.remoteStreamsMapped).length > 0) {
      for (let i in adaptor.remoteStreamsMapped) {
        let st =
          adaptor.remoteStreamsMapped[i] &&
          'toURL' in adaptor.remoteStreamsMapped[i]
            ? adaptor.remoteStreamsMapped[i].toURL()
            : null;

        //if (PlayStreamsListArr.includes(i)) {
          if (st) remoteStreamArr.push(st);
        //}
      }
    }

    setremoteStreams(remoteStreamArr);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.heading}>Ant Media WebRTC Multi Track Player</Text>
        {!isPlaying ? (
          <>
            <TouchableOpacity onPress={startPlaying} style={styles.button}>
              <Text>Start Playing</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={ () => {
              getTracks();
              console.log("tracks: ", tracks);
              console.log("remoteStreams: ", remoteStreams);
              remoteStreams.map((a, index) => {
                const count = remoteStreams.length;
                console.log('count', count);
              });
              setIsPlaying(true);
            }
            } style={styles.button}>
              <Text>Refresh</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.heading1}>Remote Streams</Text>
            {remoteStreams.length <= 3 ? (
              <>
                <View
                  style={{
                    flexDirection: 'row',
                    alignSelf: 'center',
                    margin: 5,
                  }}
                >
                  {remoteStreams.map((a, index) => {
                    const count = remoteStreams.length;
                    console.log('count', count);

                    if (a)
                      return (
                        <View key={index}>
                          <>{rtc_view(a, styles.players)}</>
                        </View>
                      );
                  })}
                </View>
              </>
            ) : (
              <></>
            )}
            <TouchableOpacity style={styles.button} onPress={stopPlaying}>
              <Text style={styles.btnTxt}>Stop Playing</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={ () => {
              getRemoteStreams();
              console.log("tracks: ", tracks);
              console.log("remoteStreams: ", remoteStreams);
              console.log("remoteStreamsMapped: ", adaptor.remoteStreamsMapped);
              adaptor.remoteStreamsMapped[roomId].getTracks().forEach((track: any) => {
                console.log("BOLA --> track: ", track);
              });
              debugger;
              remoteStreams.map((a, index) => {
                const count = remoteStreams.length;
                console.log('count', count);
              });
              setIsPlaying(true);
            }
            } style={styles.button}>
              <Text>Refresh</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    alignSelf: 'center',
    width: '80%',
    height: '80%',
  },
  players: {
    backgroundColor: '#DDDDDD',
    paddingVertical: 5,
    paddingHorizontal: 10,
    margin: 5,
    width: 100,
    height: 150,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  localPlayer: {
    backgroundColor: '#DDDDDD',
    borderRadius: 5,
    marginBottom: 5,
    height: 180,
    flexDirection: 'row',
  },
  btnTxt: {
    color: 'black',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDDDDD',
    padding: 10,
    width: '100%',
    marginTop: 20,
  },
  heading: {
    alignSelf: 'center',
    marginBottom: 5,
    padding: 2,
  },
  heading1: {
    alignSelf: 'center',
    marginTop: 20,
  },
});
