import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useLockBodyScroll, useClickAway } from 'react-use';

const SubmitModal = ({ open, setOpen }) => {
  const ref = useRef(null);
  useLockBodyScroll(open);
  useClickAway(ref, () => {
    setOpen(false);
  });

  const [syntaxHighlight, setSyntaxHighlight] = useState({
    name: '',
    url: '',
  });

  const handleChange = (e) => {
    setSyntaxHighlight({
      ...syntaxHighlight,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmitHighlight = () => {
    // FIXME: Submit to Notion API or Google Sheet, whatever you want
    console.log(syntaxHighlight);
    setOpen(false);
  };

  return (
    <div className="modal__backdrop">
      <div ref={ref} className="modal">
        <button
          type="button"
          className="modal__close"
          onClick={() => setOpen(false)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            height="24"
            width="24"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <header className="modal__header">
          <h2 className="tagline">
            Thanks for your interest in submitting to Syntax.fm!
          </h2>
          <p>
            If you'd like to submit a Potluck question, follow the link below to
            the Google Form.
          </p>
          <p>
            If you want to submit your portfolio for the next Syntax Highlight,
            enter your name and the URL to your page below!
          </p>
        </header>
        <main className="modal__content">
          <ol className="submission">
            <li className="submission__potluck">
              <a
                target="_blank"
                href="https://docs.google.com/forms/d/e/1FAIpQLSfQlAo1wXHiJMySdU-h8QMtfoz92aMS9eycEHXB6eRCLh8KHA/viewform"
                className="submission__potluck--header"
                rel="noopener noreferrer"
              >
                Potluck Question
              </a>
            </li>
            <li className="submission__highlight">
              <h3 className="submission__highlight--header">
                Portfolio Submission
              </h3>
              <form className="submission__highlight--body">
                <div className="submission__highlight--question">
                  <label htmlFor="name">
                    Name
                    <input
                      name="name"
                      type="text"
                      placeholder="Andy Warhol"
                      onChange={handleChange}
                      value={syntaxHighlight.name}
                    />
                  </label>
                </div>
                <div className="submission__highlight--question">
                  <label htmlFor="url">
                    URL
                    <input
                      name="url"
                      type="text"
                      placeholder="funnyguy.com"
                      onChange={handleChange}
                      value={syntaxHighlight.url}
                    />
                  </label>
                </div>
              </form>
              <div className="submission__highlight--footer">
                <button
                  type="button"
                  className="submission__highlight--submit"
                  onClick={() => handleSubmitHighlight()}
                >
                  Submit
                </button>
                <button
                  type="button"
                  className="submission__highlight--cancel"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </li>
          </ol>
        </main>
      </div>
    </div>
  );
};

SubmitModal.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
};

export default SubmitModal;
