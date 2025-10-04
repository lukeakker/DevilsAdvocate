import { useState, useEffect } from 'react';

type Props = {
  text: string;
  animate?: boolean;
};

export function ReplyText({ text, animate = true }: Props) {
  const [displayText, setDisplayText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 1200;
  const needsTruncation = text.length > maxLength;

  useEffect(() => {
    if (!animate) {
      setDisplayText(text);
      return;
    }

    let i = 0;
    setDisplayText('');

    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [text, animate]);

  const shouldTruncate = needsTruncation && !isExpanded;
  const shownText = shouldTruncate ? displayText.slice(0, maxLength) : displayText;

  return (
    <div className="text-center px-4">
      <p className="text-2xl md:text-3xl lg:text-4xl font-light text-fg leading-relaxed">
        {shownText}
        {shouldTruncate && '...'}
      </p>
      {needsTruncation && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 px-4 py-2 text-sm text-orb-from hover:text-orb-to transition-colors focus:outline-none focus:ring-2 focus:ring-orb-from/50 rounded"
        >
          {isExpanded ? 'Show Less' : 'Expand'}
        </button>
      )}
    </div>
  );
}
