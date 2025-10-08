import React, { useEffect, useMemo, useState, useCallback } from "react";

import CustomModal from "./components/modal";
import ReactWebChat, {
  createStore,
  createDirectLine,
  createBrowserWebSpeechPonyfillFactory
} from "botframework-webchat";
import { generate_token, getParameterByName, generateServerToken,ChatbotStyle } from './utils/webchatutils';
// // // 🧩 Consistent ponyfill to avoid Safari warnings
// const ponyfill = {
//   setTimeout,
//   clearTimeout,
//   setInterval,
//   clearInterval,
//   requestAnimationFrame,
//   cancelAnimationFrame
// };
const App = () => {
  // -------------------------------
  // 🧠 State management
  // -------------------------------
  const [modal, setModal] = useState(false);
  const [activeItem, setActiveItem] = useState({});
  const [isButtonClicked, setIsButtonClicked] = useState(false);
  const [nextAction, setNextAction] = useState(null);
  const [resError, setResError] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
 const [token, setToken] = useState();
 
  const [username, setusername] = useState();



    useEffect(() => {
   
       handleFetchToken();
       const name = getParameterByName('ref');

       if(name) setusername(name);
       console.log("Username from URL:", name);
   
  }, []);

  const toPopulate = [
    "reviewapplication",
    "livenessdetection",
    "loancomputation",
    "peninput",
    "signatureinput",
    "webattachment",
    "termsandconditions_pl",
    "termsandconditions_acqui"
  ];

  const store = useMemo(
    () =>
      createStore( { }, () => next => action => {
        if (action.type === "DIRECT_LINE/POST_ACTIVITY") {
          const { activity } = action.payload;

          if (
            activity?.value &&
            Object.prototype.hasOwnProperty.call(activity.value, "actiontype") &&
             toPopulate.includes(activity.value.actiontype) &&
            !activity.value.nextaction
          ) {
            setModal(true);
            setActiveItem(activity.value);
            activity.value.nextaction = true;
            setNextAction(action);
            return; // Stop dispatching this until modal is handled
          }
        }

        return next(action);
      }),
    [] // no deps → only run once
  );


  // -------------------------------
  // 🎛️ Modal controls
  // -------------------------------
  const toggle = useCallback(() => {
    setModal(prev => !prev);
  }, []);

  const handleSubmit = useCallback(
    item => {
      toggle();

      if (item === "tryagain") {
        setModal(true);
        return;
      }

      if (nextAction) {
        const updatedNextAction = {
          ...nextAction,
          payload: {
            ...nextAction.payload,
            activity: {
              ...nextAction.payload.activity,
              value: item.newActiveItem
            }
          }
        };

        store.dispatch(updatedNextAction);
        setNextAction(null); // clear after dispatch
      }
    },
    [nextAction, store, toggle]
  );

  // -------------------------------
  // 🔐 reCAPTCHA Token Handler
  // -------------------------------
  const handleCaptchaToken = useCallback(
    token => {
      setCaptchaToken(token);
      console.log("Captcha token received:", token);
      // Example if you later want to send it to bot:
      // store.dispatch({
      //   type: 'DIRECT_LINE/POST_ACTIVITY',
      //   payload: {
      //     activity: {
      //       type: 'message',
      //       text: `Captcha Token: ${token}`,
      //       from: { id: 'user1', name: 'User' }
      //     }
      //   }
      // });
    },
    [store]
  );

  const attachmentMiddleware = useCallback(
    () => next => card => {
      const { activity, attachment } = card;
      const { activities } = store.getState();

      const messages = activities.filter(a => a.type === "message");
      const mostRecent = messages[messages.length - 1] === activity;

      if (attachment.contentType === "application/vnd.microsoft.card.adaptive") {
        const updatedContent = {
          ...attachment.content,
          actions: attachment.content.actions?.map(action => ({
            ...action,
            isEnabled: !isButtonClicked && mostRecent
          }))
        };

        return React.createElement(window.WebChat.Components.AdaptiveCardContent, {
          actionPerformedClassName: "card__action--performed",
          content: updatedContent,
          disabled: !mostRecent,
          onAction: () => {
            if (!isButtonClicked) setIsButtonClicked(true);
          }
        });
      }

      return next(card);
    },
    [isButtonClicked, store]
  );



  const handleFetchToken = useCallback(async () => {
    if (!token) {
      const path = window.location.pathname;
      const filename = path.substring(path.lastIndexOf('/') + 1);
      const res = await generateServerToken(filename);
      setToken(res.token);
    }
  }, [token]);
  

    const isSafari = (() => {
      const ua = navigator.userAgent.toLowerCase();
      const isSafari = /^((?!chrome|android|crios|fxios|edg|opr).)*safari/i.test(navigator.userAgent);
      const isAppleDevice = /iphone|ipad|ipod|macintosh/.test(ua);

      return isSafari && isAppleDevice;
    })();
  //having an error with websocket in safari
  // -------------------------------
  // 🚀 Direct Line instance
  // -------------------------------
  console.log(isSafari,'sssssssssssssssss')
  const directLine = useMemo(() => createDirectLine({ token, webSocket: !isSafari, }), [token]);
  // -------------------------------
  // 🧱 UI Rendering
  // -------------------------------
return (
  <div id="app">
    {modal && (
      <CustomModal
        activeItem={activeItem}
        toggle={toggle}
        onSave={handleSubmit}
      />
    )}

    {directLine && username && (
      <ReactWebChat
        className="chat"
        // onCaptchaToken={handleCaptchaToken}
        //  ponyfill={ponyfill}
         
        attachmentMiddleware={attachmentMiddleware}
         store={store}
        directLine={directLine}
        username={username}
       
        styleOptions={ChatbotStyle()}
      />
    )}
  </div>
);
};

export default App;
