import React from 'react';
import Page from '../components/Page';
import Meta from '../components/meta';

export default function SuggestPage() {
  return (
    <>
      <Meta staticPage={{ title: 'Suggest a guest for supper club' }} />
      <iframe
        src="https://docs.google.com/forms/d/e/1FAIpQLScV6jkyfuzWl2zeMKQkORorDG-BVCUop6ulTDqsTDvQo2hSwQ/viewform"
        title="Suggest a guest for supper club"
        style={{
          position: 'absolute',
          inset: '0 0 0 0',
          width: '100%',
          height: '100vh',
        }}
        frameBorder="0"
      />
    </>
  );
}
