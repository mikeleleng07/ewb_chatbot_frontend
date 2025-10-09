import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import CustomModal from "./components/Modal";
import ReactWebChat, { createStore, createDirectLine } from "botframework-webchat";
import { generateServerToken, getParameterByName, ChatbotStyle } from "./utils/webchatutils";

function App() {
  const mainRef = useRef();

  // -------------------------------
  // 🧠 State
  // -------------------------------
  const [modal, setModal] = useState(false);
  const [activeItem, setActiveItem] = useState({});
  const [isButtonClicked, setIsButtonClicked] = useState(false);
  const [nextAction, setNextAction] = useState(null);
  const [token, setToken] = useState();
  const [username, setUsername] = useState();
  const [captchaToken, setCaptchaToken] = useState(null);

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

  // -------------------------------
  // 🔑 Token & Username
  // -------------------------------
  const handleFetchToken = useCallback(async () => {
    if (!token) {
      const path = window.location.pathname;
      const filename = path.substring(path.lastIndexOf("/") + 1);
      const res = await generateServerToken(filename);
      setToken(res.token);
    }
  }, [token]);

  useEffect(() => {
    handleFetchToken();
    const name = getParameterByName("ref");
    if (name) setUsername(name);
  }, [handleFetchToken]);

  // -------------------------------
  // 🏪 Store with middleware
  // -------------------------------
  const store = useMemo(
    () =>
      createStore({}, () => next => action => {
        if (
          action.type === "DIRECT_LINE/POST_ACTIVITY" &&
          action.payload?.activity?.value &&
          toPopulate.includes(action.payload.activity.value.actiontype) &&
          !action.payload.activity.value.nextaction
        ) {
          setModal(true);
          setActiveItem(action.payload.activity.value);
          action.payload.activity.value.nextaction = true;
          setNextAction(action);
          return; // stop dispatch until modal is handled
        }
        return next(action);
      }),
    []
  );

  // -------------------------------
  // 🎛️ Modal handlers
  // -------------------------------
  const toggleModal = useCallback(() => setModal(prev => !prev), []);

  const handleSubmit = useCallback(
    item => {
      toggleModal();

      if (item === "tryagain") {
        setModal(true);
        return;
      }

      if (nextAction) {
        const updatedAction = {
          ...nextAction,
          payload: {
            ...nextAction.payload,
            activity: {
              ...nextAction.payload.activity,
              value: item.newActiveItem
            }
          }
        };

        store.dispatch(updatedAction);
        setNextAction(null);
      }
    },
    [nextAction, store, toggleModal]
  );

  // -------------------------------
  // 🔐 reCAPTCHA handler
  // -------------------------------
  const handleCaptchaToken = useCallback(token => {
    setCaptchaToken(token);
    console.log("Captcha token received:", token);
  }, []);

  // -------------------------------
  // 📎 Attachment middleware
  // -------------------------------
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
          onAction: () => !isButtonClicked && setIsButtonClicked(true)
        });
      }

      return next(card);
    },
    [isButtonClicked, store]
  );

  // -------------------------------
  // 🖥️ DirectLine with Safari workaround
  // -------------------------------
  const isSafari = (() => {
    const ua = navigator.userAgent.toLowerCase();
    const isSafari = /^((?!chrome|android|crios|fxios|edg|opr).)*safari/i.test(navigator.userAgent);
    const isAppleDevice = /iphone|ipad|ipod|macintosh/.test(ua);
    return isSafari && isAppleDevice;
  })();

  const directLine = useMemo(
    () => createDirectLine({ token, webSocket: !isSafari }),
    [token, isSafari]
  );

  // -------------------------------
  // ⚡ Safe store subscription (activities only)
  // -------------------------------
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const activities = store.getState().activities || [];
      // handle activities safely if needed
    });

    return unsubscribe;
  }, [store]);

  // -------------------------------
  // 🧱 Render
  // -------------------------------
  return (
    <div id="app-container" ref={mainRef}>
      {modal && <CustomModal activeItem={activeItem} toggle={toggleModal} onSave={handleSubmit} />}

      {directLine && username && (
        <ReactWebChat
          className="chat"
          attachmentMiddleware={attachmentMiddleware}
          store={store}
          directLine={directLine}
          username={username}
          styleOptions={ChatbotStyle()}
        />
      )}
    </div>
  );
}

export default App;
