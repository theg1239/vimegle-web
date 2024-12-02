import React, { useMemo } from 'react';
import '../snowfall.css';

const Snowfall: React.FC = () => {
  const snowflakes = useMemo(
    () =>
      Array.from({ length: 100 }).map((_, index) => (
        <div key={index} className="snowflake"></div>
      )),
    [] 
  );

  return <div className="snowfall">{snowflakes}</div>;
};

export default React.memo(Snowfall);
