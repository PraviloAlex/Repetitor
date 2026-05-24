import { useNavigate } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext";
import Badge from "./ui/Badge";
import PrimaryButton from "./ui/PrimaryButton";

type Props = {
  count: number;
};

export default function ReviewCard({ count }: Props) {
  const navigate = useNavigate();
  const { t } = useI18n();
  if (count <= 0) return null;

  const todayCount = Math.min(7, count);

  return (
    <section className="review-card">
      <div>
        <Badge variant="review">{t("review_card_badge")}</Badge>
        <h2 className="review-card__title">{t("review_card_title")}</h2>
        <p className="review-card__body">
          {t("review_card_body", { n: String(todayCount), minutes: "8" })}
        </p>
      </div>
      <PrimaryButton variant="soft" onClick={() => navigate("/review")}>
        {t("review_card_cta", { n: String(todayCount) })}
      </PrimaryButton>
    </section>
  );
}
