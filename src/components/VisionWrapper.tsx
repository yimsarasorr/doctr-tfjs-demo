// Copyright (C) 2021, Mindee.

// This program is licensed under the Apache License version 2.
// See LICENSE or go to <https://www.apache.org/licenses/LICENSE-2.0.txt> for full license details.

import { Grid, makeStyles, Portal, Theme } from "@material-ui/core";
import { GraphModel } from "@tensorflow/tfjs";
import { createRef, useEffect, useMemo, useRef, useState } from "react";
import {
  AnnotationData,
  AnnotationShape,
  drawLayer,
  drawShape,
  setShapeConfig,
  Stage,
} from "react-mindee-js";
import { DET_CONFIG, RECO_CONFIG } from "src/common/constants";
import {
  extractBoundingBoxesFromHeatmap,
  extractWords,
  getHeatMapFromImage,
  loadDetectionModel,
  loadRecognitionModel,
} from "src/utils";
import { useStateWithRef } from "src/utils/hooks";
import { flatten } from "underscore";
import { ProcessMetadata, UploadedFile, Word } from "../common/types";
import AnnotationViewer from "./AnnotationViewer";
import HeatMap from "./HeatMap";
import ImageViewer from "./ImageViewer";
import Sidebar from "./Sidebar";
import WordsList from "./WordsList";

const COMPONENT_ID = "VisionWrapper";

const useStyles = makeStyles((theme: Theme) => ({
  wrapper: {},
}));

export default function VisionWrapper(): JSX.Element {
  const classes = useStyles();
  const [detConfig, setDetConfig] = useState(DET_CONFIG.db_mobilenet_v2);
  const [recoConfig, setRecoConfig] = useState(RECO_CONFIG.crnn_vgg16_bn);
  const [loadingImage, setLoadingImage] = useState(false);
  const recognitionModel = useRef<GraphModel | null>(null);
  const detectionModel = useRef<GraphModel | null>(null);
  const imageObject = useRef<HTMLImageElement>(new Image());
  const heatMapContainerObject = useRef<HTMLCanvasElement | null>(null);
  const annotationStage = useRef<Stage | null>();
  const [extractingWords, setExtractingWords] = useState(false);
  const [annotationData, setAnnotationData] = useState<AnnotationData>({
    image: null,
  });
  const [words, setWords, wordsRef] = useStateWithRef<Word[]>([]);
  const fieldRefsObject = useRef(words.map(() => createRef<HTMLDivElement>()));

  useEffect(() => {
    fieldRefsObject.current = words.map(() => createRef<HTMLDivElement>());
  }, [words]);

  useEffect(() => {
    setWords([]);
    setAnnotationData({ image: null });
    imageObject.current.src = "";
    if (heatMapContainerObject.current) {
      const context = heatMapContainerObject.current.getContext("2d");
      context?.clearRect(
        0,
        0,
        heatMapContainerObject.current.width,
        heatMapContainerObject.current.height
      );
    }
    loadRecognitionModel({ recognitionModel, recoConfig });
  }, [recoConfig]);

  useEffect(() => {
    setWords([]);
    setAnnotationData({ image: null });
    imageObject.current.src = "";
    if (heatMapContainerObject.current) {
      const context = heatMapContainerObject.current.getContext("2d");
      context?.clearRect(
        0,
        0,
        heatMapContainerObject.current.width,
        heatMapContainerObject.current.height
      );
    }
    loadDetectionModel({ detectionModel, detConfig });
  }, [detConfig]);

  const onShapeClick = (shape: AnnotationShape) => {
    const fieldIndex = wordsRef.current.findIndex(
      (word) => word.id === shape.id
    );
    if (fieldIndex >= 0 && fieldRefsObject.current[fieldIndex]?.current) {
      fieldRefsObject.current[fieldIndex].current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  return (
    <Grid spacing={3} className={classes.wrapper} item id={COMPONENT_ID} container>
      <Portal container={document.getElementById("upload-container")!}>
        <ImageViewer loadingImage={loadingImage} onUpload={() => {}} />
      </Portal>
      <HeatMap heatMapContainerRef={heatMapContainerObject} />
      <Grid item xs={12} md={3}>
        <Sidebar detConfig={detConfig} setDetConfig={setDetConfig} recoConfig={recoConfig} setRecoConfig={setRecoConfig} />
      </Grid>
      <Grid xs={12} item md={5}>
        <AnnotationViewer
          loadingImage={loadingImage}
          setAnnotationStage={(stage) => (annotationStage.current = stage)}
          annotationData={annotationData}
          onShapeMouseEnter={() => {}}
          onShapeMouseLeave={() => {}}
          onShapeClick={onShapeClick}
        />
      </Grid>
      <Grid xs={12} item md={4}>
        <WordsList
          fieldRefsObject={fieldRefsObject.current}
          onFieldMouseLeave={() => {}}
          onFieldMouseEnter={() => {}}
          extractingWords={extractingWords}
          words={words}
          processingTime={0}
          fileSize={0}
          imageResolution="0x0"
        />
      </Grid>
    </Grid>
  );
}
