import React, { useCallback, useRef, useState, useEffect } from 'react';

import {
  View,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
} from 'react-native';
import { useAntMedia, rtc_view } from '@antmedia/react-native-ant-media';

import InCallManager from 'react-native-incall-manager';

export default function MultiTrackConference() {
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
  let roomOfStream: any = useRef([]).current;
  let publishStreamId: any = useRef('').current;
  const [PlayStreamsListArr, updatePlayStreamsListArr] = useState<any>([]);
  let streamsList: any = useRef([]).current;

  let allStreams: any = [];

  const adaptor = useAntMedia({
    url: webSocketUrl,
    mediaConstraints: {
      audio: true,
      video: {
        width: 640,
        height: 480,
        frameRate: 30,
        facingMode: 'front',
      },
    },
    callback(command: any, data: any) {
      console.log("--------> ", command, data);
      switch (command) {
        case 'pong':
          break;
        case 'joinedTheRoom':
          const tok = data.ATTR_ROOM_NAME;
          roomOfStream[data.streamId] = tok;
          console.log('joined the room: ' + tok);

          publishStreamId = data.streamId;
          console.log('publishStreamId: ' + publishStreamId);
          //streamsList = data.streams;
          console.log('data.streams: ', data.streams);
          console.log('streamsList: ', streamsList);

          adaptor.publish(publishStreamId, "", "", "", "", roomId,"{someKey:somveValue}");

          roomTimerId = setInterval(() => {
            //console.log(roomId, data.streamId);
            //adaptor.getRoomInfo(roomId, data.streamId);
          }, 5000);

          break;
        case 'newStreamAvailable':
          //playVideo(data);
          break;
        case 'publish_started':
          setIsPublishing(true);
          console.log('publish_started to room: ' + roomOfStream[data.streamId]);
          adaptor.getRoomInfo(roomId, publishStreamId);
          break;
        case 'publish_finished':
          setIsPublishing(false);
          break;
        case 'leavedFromRoom':
          const room = data.ATTR_ROOM_NAME;
          console.log('leavedFromRoom: ' + room);

          clearRoomInfoInterval();

          if (streamsList != null) {
            streamsList.forEach(function (item: any) {
              removeRemoteVideo(item);
            });
          }

          // we need to reset streams list
          streamsList = [];
          setIsPlaying(false);
          break;
        case 'closed':
          console.log('Connecton closed');
          break;
        case 'play_finished':
          console.log('play_finished');
          removeRemoteVideo(data.streamId);
          setIsPlaying(false);
          break;
        case 'streamInformation':
          //streamInformation(obj);
          break;
        case 'roomInformation':
          let tempList = data.streams;
          //tempList.push("!"+publishStreamId);
          adaptor.play(roomId, "", "", tempList);
          break;
        case 'data_received':
          //handleNotificationEvent(obj);
          break;
        default:
          break;
      }
    },
    callbackError: (err: any, data: any) => {
      console.error('callbackError', err, data);
      clearRoomInfoInterval();
    },
    peer_connection_config: {
      iceServers: [
        {
          url: 'stun:stun.l.google.com:19302',
        },
      ],
    },
    debug: false,
  });

  const removeRemoteVideo = (streamId: any) => {
    streamsList = [];

    adaptor.stop(streamId);
    streamsList = PlayStreamsListArr.filter((item: any) => item !== streamId);
    updatePlayStreamsListArr(streamsList);
  };

  const clearRoomInfoInterval = () => {
    console.log('interval cleared');
    clearInterval(roomTimerId);
  };

  const handleConnect = useCallback(() => {
    if (adaptor) {
      adaptor.joinRoom(roomId, undefined, "multitrack");
      setIsPlaying(true);
    }
  }, [adaptor, roomId]);

  const handleDisconnect = useCallback(() => {
    if (adaptor) {
      adaptor.leaveFromRoom(roomId);

      allStreams = [];

      clearRoomInfoInterval();
      setIsPlaying(false);
    }
  }, [adaptor, clearRoomInfoInterval, roomId]);

  useEffect(() => {
    const verify = () => {
      if (adaptor.localStream.current && adaptor.localStream.current.toURL()) {
        return setLocalMedia(adaptor.localStream.current.toURL());
      }
      setTimeout(verify, 5000);
    };
    verify();
  }, [adaptor.localStream]);

  useEffect(() => {
    if (localMedia && remoteStreams) {
      InCallManager.start({ media: 'video' });
    }
  }, [localMedia, remoteStreams]);

  const getRemoteStreams = () => {
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
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.heading}>Ant Media WebRTC MultiTrack Conference</Text>
        <Text style={styles.heading}>Local Stream</Text>
        {localMedia ? <>{rtc_view(localMedia, styles.localPlayer)}</> : <></>}
        {!isPlaying ? (
          <>
            <TouchableOpacity onPress={handleConnect} style={styles.button}>
              <Text>Join Room</Text>
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
            <TouchableOpacity style={styles.button} onPress={handleDisconnect}>
              <Text style={styles.btnTxt}>Leave Room</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity style={styles.button} onPress={getRemoteStreams}>
          <Text style={styles.btnTxt}>Refresh Room</Text>
        </TouchableOpacity>
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
