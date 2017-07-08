import React from 'react';

export default ({ className, link, provider }) => {
  const slug = className || provider.replace(/\s/g, '').toLowerCase();

  return (
    <li className={`subscribe__link subscribe__link--${slug}`}>
      <a href={link} rel="noopener noreferrer" target="_blank">{provider}</a>
    </li>
  );
};
