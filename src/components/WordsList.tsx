// Copyright (C) 2021, Mindee. 
// This program is licensed under the Apache License version 2.

import React from "react";
import {
  Box,
  CircularProgress,
  Grid,
  makeStyles,
  Theme,
  Typography,
} from "@material-ui/core";
import { Card } from "@mindee/web-elements.ui.card";
import { Word } from "src/common/types";
import { COLORS, FONTS } from "@mindee/web-elements.assets";

const COMPONENT_ID = "WordsList";

const useStyles = makeStyles((theme: Theme) => ({
  wrapper: {
    height: "100%",
  },
  list: {
    overflow: "hidden auto",
    height: "465px",
    width: "100%",
  },
  item: {
    width: "100%",
    padding: 20,
    cursor: "pointer",
    borderBottom: `1px solid ${theme.palette.grey[100]}`,
    borderLeft: "3px solid transparent",
    "&:hover": {
      borderLeftWidth: 8,
    },
  },
  loader: {
    margin: "auto",
  },
  metadataBox: {
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(2),
    borderRadius: 4,
    marginBottom: theme.spacing(2),
  },
  metadataText: {
    marginBottom: theme.spacing(1),
    "&:last-child": {
      marginBottom: 0,
    },
  },
}));

interface Props {
  words: Word[];
  extractingWords: boolean;
  onFieldMouseLeave: (word: Word) => void;
  onFieldMouseEnter: (word: Word) => void;
  fieldRefsObject: React.RefObject<HTMLDivElement>[];
  processingTime: number;
  fileSize: number;
  imageResolution: string;
}

export default function WordsList({
  words,
  onFieldMouseEnter,
  onFieldMouseLeave,
  extractingWords,
  fieldRefsObject,
  processingTime,
  fileSize,
  imageResolution,
}: Props): JSX.Element {
  const classes = useStyles();

  const renderMetadata = () => (
    <Box className={classes.metadataBox}>
      <Typography variant="body2" className={classes.metadataText}>
        Processing time: <strong>{processingTime.toFixed(2)} seconds</strong>
      </Typography>
      <Typography variant="body2" className={classes.metadataText}>
        File size: <strong>{(fileSize / (1024 * 1024)).toFixed(2)} MB</strong>
      </Typography>
      <Typography variant="body2" className={classes.metadataText}>
        Resolution: <strong>{imageResolution}</strong>
      </Typography>
    </Box>
  );

  return (
    <Card
      topBar
      header={
        <Box display="flex" flexDirection="column">
          <Typography style={{ fontFamily: FONTS.bold }} paragraph variant="subtitle1">
            4 - Visualize word values
          </Typography>
          <Typography style={{ fontSize: 14, marginTop: -5 }} variant="caption">
            {words.length ? `${words.length} words identified` : "No words identified"}
          </Typography>
        </Box>
      }
      contentStyle={{ paddingTop: 20 }}
      id={COMPONENT_ID}
      className={classes.wrapper}
    >
      {renderMetadata()}

      <Grid container id={COMPONENT_ID} className={classes.list}>
        {!extractingWords && words.length === 0 && (
          <Box height="100%" width="100%" display="flex" alignItems="center" justifyContent="center">
            <Typography variant="body2">No image uploaded yet</Typography>
          </Box>
        )}

        {extractingWords ? (
          <CircularProgress className={classes.loader} />
        ) : (
          words.map((word, key) => (
            <Grid
              onMouseEnter={() => onFieldMouseEnter(word)}
              onMouseLeave={() => onFieldMouseLeave(word)}
              className={classes.item}
              key={key}
              item
              ref={fieldRefsObject[key]}
              xs={12}
              style={{
                borderLeftColor: word.color,
                borderLeftWidth: word.isActive ? 8 : 3,
              }}
            >
              <Typography>{word.words.join(", ")}</Typography>
            </Grid>
          ))
        )}
      </Grid>
    </Card>
  );
}
