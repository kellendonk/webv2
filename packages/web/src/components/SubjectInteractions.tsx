import React, { useCallback, useEffect, useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';

export interface SubjectInteractionsProps {
  readonly subject: string;
}

export const SubjectInteractions = ({ subject }: SubjectInteractionsProps) => {
  const query = useQuery(GET_INTERACTIONS, {
    variables: { subject },
  });

  const [addInteractionMutation] = useMutation(ADD_INTERACTION, {
    refetchQueries: [GET_INTERACTIONS],
  });

  const addInteraction = useCallback(
    (interaction: string) =>
      addInteractionMutation({
        variables: {
          subject,
          interaction,
        },
      }),
    [addInteractionMutation, subject],
  );

  const interactions = [...(query.data?.getInteractions ?? [])].sort(
    (a, b) => b.count - a.count,
  );

  return (
    <>
      {interactions.map((interaction) => (
        <Interaction
          key={interaction.id}
          interaction={interaction.interaction}
          count={interaction.count}
          addInteraction={() => addInteraction(interaction.interaction)}
        />
      ))}
    </>
  );
};

interface InteractionProps {
  readonly interaction: string;
  readonly count: number;
  readonly addInteraction: () => void;
}

const Interaction = (props: InteractionProps) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(Math.max(count, props.count));
  }, [count, setCount, props]);

  function onClick() {
    // Give the illusion of speed and refresh later.
    setCount(count + 1);
    props.addInteraction();
  }

  return (
    <InteractionButton interaction={props.interaction} onClick={onClick}>
      {Intl.NumberFormat().format(count)}
    </InteractionButton>
  );
};

type InteractionButtonProps = React.PropsWithChildren<{
  readonly interaction: React.ReactNode;
  readonly onClick: () => void;
}>;

const InteractionButton = (props: InteractionButtonProps) => (
  <button
    onClick={props.onClick}
    className="flex justify-center items-center gap-1 hover:bold"
  >
    <div className="text-xl">{props.interaction}</div>
    {props.children}
  </button>
);

const GET_INTERACTIONS = gql`
  query GetInteractions($subject: String!) {
    getInteractions(subject: $subject) {
      id
      subject
      interaction
      count
    }
  }
`;

const ADD_INTERACTION = gql`
  mutation AddInteraction($subject: String!, $interaction: String!) {
    addInteraction(subject: $subject, interaction: $interaction) {
      subject
      interaction
    }
  }
`;
