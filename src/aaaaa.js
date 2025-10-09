import React, { useState, useEffect, useCallback } from 'react';
import ReactWebChat, {
  createDirectLine,
  createStore,
} from 'botframework-webchat';
import { ConnectionStatus } from 'botframework-directlinejs';

const WebChat = props => {
  const [loading, setLoading] = useState(true);
  const [userID, setUserID] = useState('dl_abc123');
  const [username, setUsername] = useState('Bobby');
  const [store, setStore] = useState(null);
  const [directLine, setDirectLine] = useState(null);

  const webChatStore = createStore({}, ({ dispatch }) => next => action => {
    connectionStatusChanged(directLine.connectionStatus$);
    if (action.type === 'DIRECT_LINE/CONNECT_FULFILLED') {
      dispatch({
        type: 'WEB_CHAT/SEND_EVENT',
        payload: {
          name: 'webchat/join',
        },
      });
    }

    if (action.type === 'DIRECT_LINE/INCOMING_ACTIVITY') {
      console.log('INCOMING ACTIVITY ', action.payload.activity);
    }
    return next(action);
  });

  const fetchToken = useCallback(async () => {
    const res = await fetch('http://localhost:3500/directline/token', { method: 'POST' });
    const { token } = await res.json();
    await setDirectLine(await createDirectLine({ token }));
    setLoading(false);
  }, [setDirectLine]);

  const connectionStatusChanged = connectionStatus => {
    switch (connectionStatus.value) {
      case ConnectionStatus.Online:
        console.log('Connected')
    }
  };

  useEffect(() => {
    if (loading === false) {
      setStore(webChatStore);
    }
    if (loading === true) {
      fetchToken();
    }
  }, []);

  return loading === false && !!directLine ? (
    <ReactWebChat
      directLine={directLine}
      userID={userID}
      username={username}
      store={store}
    />
  ) : (
    <div>Loading...</div>
  );
};

export default WebChat