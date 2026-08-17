import React from 'react';
import AppBar from '@/components/m3/AppBar';
import CaseHeader from '@/components/m3/CaseHeader';

export default function AppHeader(props) {
  return (
    <>
      <AppBar {...props} />
      <CaseHeader
        sharedBy={props.sharedBy}
        documents={props.documents}
        persons={props.persons}
        redFlags={props.redFlags}
        contradictions={props.contradictions}
      />
    </>
  );
}
