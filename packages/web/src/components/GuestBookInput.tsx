import React, { useEffect, useRef, useState } from 'react';
import CanvasDraw from 'react-canvas-draw';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEraser, faSave, faUndo } from '@fortawesome/free-solid-svg-icons';
import { gql, useMutation, useQuery } from '@apollo/client';

export function GuestBookInput(props: { subject: string }): JSX.Element {
  const [addGuestBookSignature] = useMutation(ADD_GUEST_BOOK_SIGNATURE, {
    refetchQueries: [GET_GUEST_BOOK_SIGNATURES],
  });

  function onSave(image: GuestBookImage) {
    addGuestBookSignature({
      variables: {
        subject: props.subject,
        image: image,
      },
    }).catch((e) => console.error(e));
  }

  return <GuestBookIllustrator save={onSave} />;
}

export function useGuestBookImages(
  subject: string,
): Array<{ image: GuestBookImage }> {
  const items = useQuery(GET_GUEST_BOOK_SIGNATURES, {
    variables: {
      subject,
    },
  });

  return items.data?.getGuestBookSignatures ?? [];
}

function simplify(img: GuestBookImage): GuestBookImage {
  let x = img;
  x = reducePointPrecision(x);
  // x = fitDimensions(x);
  return x;
}

function reducePointPrecision(image: GuestBookImage): GuestBookImage {
  const factor = 100;
  const round = (x: number) => Math.round(x * factor) / factor;

  // Reduce line precision
  const lines: GuestBookImageLine[] = image.lines.map((line) => ({
    ...line,
    points: line.points.map((point) => {
      return {
        x: round(point.x),
        y: round(point.y),
      };
    }),
  }));

  return {
    ...image,
    lines,
  };
}

function fitDimensions(image: GuestBookImage): GuestBookImage {
  type Point = { x: number; y: number };
  let min: Point | undefined = undefined;
  let max: Point | undefined = undefined;

  // Find bounding box
  for (const line of image.lines) {
    for (const point of line.points) {
      min = min
        ? {
            x: Math.min(min.x, point.x - line.brushRadius),
            y: Math.min(min.y, point.y - line.brushRadius),
          }
        : point;
      max = max
        ? {
            x: Math.max(max.x, point.x + line.brushRadius),
            y: Math.max(max.y, point.y + line.brushRadius),
          }
        : point;
    }
  }

  if (!min || !max) {
    return image;
  }

  return {
    width: max.x - min.x,
    height: max.y - min.y,
    lines: image.lines.map((line) => ({
      ...line,
      // Translate the points to the beginning of the box
      points: line.points.map((point) => ({
        x: point.x - min.x,
        y: point.y - min.y,
      })),
    })),
  };
}

interface GuestBookIllustratorProps {
  readonly save: (x: GuestBookImage) => void;
}

function GuestBookIllustrator(props: GuestBookIllustratorProps): JSX.Element {
  const [imagePreview, setImagePreview] = useState<GuestBookImage>();

  function onSave(canvasDraw: CanvasDraw) {
    const saveData = canvasDraw.getSaveData();
    const image = JSON.parse(saveData);
    const simplified = simplify(image);

    if (props.save) {
      props.save(simplified);
    }
  }

  const canvasDrawRef = useRef<CanvasDraw>();

  useEffect(() => {
    const interval = setInterval(() => {
      if (!canvasDrawRef.current) return;
      const saveData = canvasDrawRef.current.getSaveData();
      const image = JSON.parse(saveData);
      const simplified = simplify(image);
      setImagePreview(simplified);
    });

    return () => {
      clearInterval(interval);
    };
  }, [canvasDrawRef, setImagePreview]);

  const buttonStyle =
    'border-2 border-[#ccc] rounded-xl px-4 py-1 inline-flex h-[40px] items-center text-[#666]';

  return (
    <div className="max-w-[350px] mx-auto">
      <CanvasDraw
        ref={canvasDrawRef}
        lazyRadius={2}
        brushRadius={2}
        canvasWidth={350}
        canvasHeight={300}
        className="border-2"
      />

      <div className="flex justify-between mt-2">
        <div className="flex">
          <button
            className={buttonStyle}
            onClick={() => canvasDrawRef.current.clear()}
          >
            <FontAwesomeIcon icon={faEraser} height={20}></FontAwesomeIcon>
          </button>
          <button
            className={buttonStyle}
            onClick={() => canvasDrawRef.current.undo()}
          >
            <FontAwesomeIcon icon={faUndo} height={20}></FontAwesomeIcon>
          </button>
        </div>
        <div className="flex">
          <button
            className={buttonStyle}
            onClick={() => onSave(canvasDrawRef.current)}
          >
            <FontAwesomeIcon icon={faSave} height={20}></FontAwesomeIcon>
          </button>
        </div>
      </div>

      {/*{imagePreview && (*/}
      {/*  <GuestBookImageDisplay image={imagePreview} width={400} />*/}
      {/*)}*/}
    </div>
  );
}

interface GuestBookImageDisplayProps {
  readonly image: GuestBookImage;
  readonly width?: number;
  readonly height?: number;
}

export function GuestBookImageDisplay({
  image,
  width,
  height,
}: GuestBookImageDisplayProps): JSX.Element {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${image.width} ${image.height}`}
    >
      {image.lines.map((line, i) => {
        const points = line.points.map((l) => `${l.x} ${l.y}`);
        const d = `M ${points.join(' L ')}`;
        return (
          <path
            key={i}
            d={d}
            stroke={line.brushColor}
            strokeWidth={line.brushRadius * 2}
            fill="transparent"
          />
        );
      })}
    </svg>
  );
}

export interface GuestBookImage {
  width: number;
  height: number;
  lines: Array<GuestBookImageLine>;
}

export interface GuestBookImageLine {
  brushColor: string;
  brushRadius: number;
  points: Array<{ x: number; y: number }>;
}

const ADD_GUEST_BOOK_SIGNATURE = gql`
  mutation AddGuestBookSignature(
    $subject: String!
    $image: InputGuestBookSignatureImage!
  ) {
    addGuestBookSignature(subject: $subject, image: $image) {
      subject
    }
  }
`;

const GET_GUEST_BOOK_SIGNATURES = gql`
  query GetGuestbookSignatures($subject: String!) {
    getGuestBookSignatures(subject: $subject) {
      id
      subject
      date
      image {
        width
        height
        lines {
          points {
            x
            y
          }
          brushColor
          brushRadius
        }
      }
    }
  }
`;
