import React, { useEffect, useState, useRef } from "react";
const humanizeDuration = require("humanize-duration");

function useInterval(callback, delay) {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    let id = setInterval(() => {
      savedCallback.current();
    }, delay);
    return () => clearInterval(id);
  }, [delay]);
}

const Countdown = ({ timeLeft, complete }) => {
  const [time, setTime] = useState(timeLeft);
  const [timeArray, setTimeArray] = useState([]);

  useInterval(() => {
    if (time > 0) {
      setTime(time - 1);
    }
    setTimeArray(
      humanizeDuration(time * 1000 - 1, {
        units: ["y", "mo", "d", "h", "m", "s"],
        round: true,
      })
        .split(",")
        .map(e => e.trim()),
    );
  }, 1000);

  return (
    <div>
      {complete ? (
        <h1 className="heading">STAKING HAS ENDED</h1>
      ) : (
        <div>
          <h1 className="heading">STAKING ENDS IN</h1>
          <div className="countdown-wrapper" draggable>
            {timeArray.map(e => (
              <div className="countdown-box">
                {e.split(" ")[0]}{" "}
                <span className="legend">{e.split(" ")[1].charAt(0).toUpperCase() + e.split(" ")[1].slice(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Countdown;
