import type { ReactNode } from "react";

type SummaryDetailCardsProps = {
  achievements: ReactNode;
  timeStats: ReactNode;
  familyRecommendation: ReactNode;
  missionResult?: ReactNode;
  practicedSkills?: ReactNode;
  weakSkills?: ReactNode;
};

export default function SummaryDetailCards(props: SummaryDetailCardsProps) {
  return (
    <>
      {props.achievements}
      {props.timeStats}
      {props.familyRecommendation}
      {props.missionResult}
      {props.practicedSkills}
      {props.weakSkills}
    </>
  );
}
