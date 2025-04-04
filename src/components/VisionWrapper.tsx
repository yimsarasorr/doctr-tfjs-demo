import { Grid, makeStyles, Portal, Theme } from "@material-ui/core";
import { GraphModel } from "@tensorflow/tfjs";
import React, { useEffect, useRef, useState } from "react";
import { AnnotationData, AnnotationShape, Stage } from "react-mindee-js";
import { DET_CONFIG, RECO_CONFIG } from "src/common/constants";
import {
  extractBoundingBoxesFromHeatmap,
  extractWords,
  getHeatMapFromImage,
  loadDetectionModel,
  loadRecognitionModel,
} from "src/utils";
import { useStateWithRef } from "src/utils/hooks";
import { ProcessMetadata, UploadedFile, Word } from "../common/types";
import AnnotationViewer from "./AnnotationViewer";
import HeatMap from "./HeatMap";
import ImageViewer from "./ImageViewer";
import Sidebar from "./Sidebar";
import WordsList from "./WordsList";
import * as tf from "@tensorflow/tfjs";

const COMPONENT_ID = "VisionWrapper";

const useStyles = makeStyles((theme: Theme) => ({
  wrapper: {},
}));

// เพิ่มฟังก์ชัน resizeImage
const resizeImage = (image: HTMLImageElement, maxWidth: number, maxHeight: number): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
  canvas.width = image.width * scale;
  canvas.height = image.height * scale;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
};

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
  const fieldRefsObject = useRef<React.RefObject<HTMLDivElement>[]>([]);
  const [metadata, setMetadata] = useState<ProcessMetadata>({
    processingTime: 0,
    fileSize: 0,
    resolution: '0x0'
  });

  // อัปเดต refs เมื่อ words เปลี่ยน
  useEffect(() => {
    fieldRefsObject.current = words.map(() => React.createRef<HTMLDivElement>());
  }, [words]);

  // โหลด WebGL backend
  useEffect(() => {
    tf.setBackend("webgl").then(() => console.log("Using WebGL backend"));
  }, []);

  // โหลดโมเดลล่วงหน้า
  useEffect(() => {
    const initModels = async () => {
      if (!recognitionModel.current) {
        await loadRecognitionModel({ recognitionModel, recoConfig });
      }
      if (!detectionModel.current) {
        await loadDetectionModel({ detectionModel, detConfig });
      }
    };
    initModels();
  }, []);

  // โหลดโมเดล Recognition เมื่อ recoConfig เปลี่ยน
  useEffect(() => {
    const init = async () => {
      setWords([]);
      setAnnotationData({ image: null });
      imageObject.current.src = "";
      if (heatMapContainerObject.current) {
        const context = heatMapContainerObject.current.getContext("2d");
        context?.clearRect(0, 0, 
          heatMapContainerObject.current.width, 
          heatMapContainerObject.current.height
        );
      }
      await loadRecognitionModel({ recognitionModel, recoConfig });
    };
    init();
  }, [recoConfig, setWords]);

  // โหลดโมเดล Detection เมื่อ detConfig เปลี่ยน
  useEffect(() => {
    const init = async () => {
      setWords([]);
      setAnnotationData({ image: null });
      imageObject.current.src = "";
      if (heatMapContainerObject.current) {
        const context = heatMapContainerObject.current.getContext("2d");
        context?.clearRect(0, 0, 
          heatMapContainerObject.current.width, 
          heatMapContainerObject.current.height
        );
      }
      await loadDetectionModel({ detectionModel, detConfig });
    };
    init();
  }, [detConfig, setWords]);

  const handleImageUpload = async (uploadedFile: UploadedFile) => {
    setLoadingImage(true);
    setExtractingWords(true);
    setWords([]);
    setMetadata({
      processingTime: 0,
      fileSize: uploadedFile.source.size,
      resolution: '0x0'
    });

    const startTime = performance.now();

    imageObject.current.onload = async () => {
      try {
        // Resize image ก่อนประมวลผล
        const resizedCanvas = resizeImage(imageObject.current, 1024, 1024);
        imageObject.current.src = resizedCanvas.toDataURL();

        // อัปเดตความละเอียดภาพ
        setMetadata(prev => ({
          ...prev,
          resolution: `${imageObject.current.width}x${imageObject.current.height}`
        }));

        // ประมวลผล Heatmap และสกัดคำพร้อมกัน
        await Promise.all([
          getHeatMapFromImage({
            heatmapContainer: heatMapContainerObject.current,
            detectionModel: detectionModel.current,
            imageObject: imageObject.current,
            size: [detConfig.height, detConfig.width],
          }),
          extractWords({
            recognitionModel: recognitionModel.current,
            stage: annotationStage.current!,
            size: [recoConfig.height, recoConfig.width],
          }).then((extractedWords) => setWords(extractedWords as Word[])),
        ]);

        // อัปเดตเวลา
        setMetadata(prev => ({
          ...prev,
          processingTime: (performance.now() - startTime) / 1000
        }));
      } catch (error) {
        console.error("Processing error:", error);
      } finally {
        setLoadingImage(false);
        setExtractingWords(false);
      }
    };

    imageObject.current.src = uploadedFile.image as string;
  };

  const handleShapeClick = (shape: AnnotationShape) => {
    const fieldIndex = wordsRef.current.findIndex(w => w.id === shape.id);
    if (fieldIndex >= 0) {
      fieldRefsObject.current[fieldIndex]?.current?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  };

  return (
    <Grid spacing={3} className={classes.wrapper} item id={COMPONENT_ID} container>
      <Portal container={document.getElementById("upload-container")!}>
        <ImageViewer 
          loadingImage={loadingImage} 
          onUpload={handleImageUpload} 
        />
      </Portal>
      
      <HeatMap heatMapContainerRef={heatMapContainerObject} />
      
      <Grid item xs={12} md={3}>
        <Sidebar
          detConfig={detConfig}
          setDetConfig={setDetConfig}
          recoConfig={recoConfig}
          setRecoConfig={setRecoConfig}
        />
      </Grid>
      
      <Grid xs={12} item md={5}>
        <AnnotationViewer
          loadingImage={loadingImage}
          setAnnotationStage={(stage) => (annotationStage.current = stage)}
          annotationData={annotationData}
          onShapeClick={handleShapeClick}
          onShapeMouseEnter={(shape) => {
            console.log("Mouse entered shape:", shape);
          }}
          onShapeMouseLeave={(shape) => {
            console.log("Mouse left shape:", shape);
          }}
        />
      </Grid>
      
      <Grid xs={12} item md={4}>
        <WordsList
          fieldRefsObject={fieldRefsObject.current}
          extractingWords={extractingWords}
          words={words}
          processingTime={metadata.processingTime}
          fileSize={metadata.fileSize}
          imageResolution={metadata.resolution}
        />
      </Grid>
    </Grid>
  );
}