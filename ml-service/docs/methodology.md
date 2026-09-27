# East Sikkim pilot methodology

## Research question

Predict whether a landslide will occur in a configured East Sikkim zone during the next 24 hours.

This is a research label, not a warning, official classification, or evacuation decision.

## Preparation

1. Supply an authorised event inventory, zone/terrain table, and time-indexed rainfall/soil table.
2. Validate event timestamps and WGS84 coordinates.
3. Restrict records to East Sikkim and landslide event types.
4. Match each event to its nearest configured zone using a 10 km default haversine threshold. Change the threshold only with a documented reason.
5. For each accepted event, choose the latest feature row at or before the event, within a 72-hour lookback. No post-event row is used.
6. Create positive rows from those matches.
7. Create negative rows only from rainfall rows explicitly marked `no_landslide_observed=true`, in the event date range and same configured zones, with no accepted event in the following 24 hours. This is still dependent on inventory completeness.
8. Write the final CSV and JSON/Markdown summary.

## Training

`train_ner_pilot.py` compares Logistic Regression, Random Forest, and XGBoost. It first attempts a chronological 80/20 split. If that cannot contain both classes, it attempts a zone holdout. It does not silently fall back to an easy random split. If neither split is valid, no metrics are claimed and no selected model is saved.

Class imbalance is handled with balanced Logistic Regression/Random Forest weights and XGBoost `scale_pos_weight`. Selection prioritises PR-AUC when computable, then F1, then recall. This criterion is documented in the model card and is not a safety calibration.

## No operational connection

The selected pilot model is saved under `models/ner_pilot/`. Existing practice model files remain unchanged. Nothing in this workflow connects the pilot model to public alerts, evacuation actions, the FastAPI practice endpoint, or dashboard decision logic.
