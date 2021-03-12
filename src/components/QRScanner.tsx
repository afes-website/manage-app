import React, { useState } from "react";
import { CircularProgress, Fade } from "@material-ui/core";
import { createStyles, makeStyles } from "@material-ui/core/styles";
import QrReader from "react-qr-reader";
import { CameraOff } from "@/components/MaterialSvgIcons";
import { ResultPopupColors } from "@/components/ResultPopup";
import UniversalErrorDialog from "@/components/UniversalErrorDialog";
import clsx from "clsx";

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      position: "relative",
      paddingTop: "100%",
      "& > *": {
        position: "absolute",
        width: "100%",
        height: "100%",
        top: 0,
      },
    },
    shadowBox: {
      border: "solid",
      borderColor: "rgba(0, 0, 0, 0.6)",
      borderWidth: theme.spacing(8),
      boxSizing: "border-box",
    },
    borderBox: {
      border: "solid",
      borderWidth: 4,
      borderRadius: 12,
      position: "relative",
      top: -4,
      left: -4,
      width: "100%",
      height: "100%",
    },
    borderSuccess: {
      borderColor: theme.palette.success.main,
    },
    borderError: {
      animation: "$searching-animation-in-error 1000ms infinite ease-out",
    },
    "@keyframes searching-animation-in-error": {
      "0%": {
        borderColor: theme.palette.error.main,
      },
      "50%": {
        borderColor: theme.palette.error.light,
      },
      "100%": {
        borderColor: theme.palette.error.main,
      },
    },
    borderLoading: {
      borderColor: theme.palette.afesLight.main,
      background: "rgba(0, 0, 0, 0.6)",
    },
    borderSearching: {
      animation: "$searching-animation 1000ms infinite ease-out",
    },
    "@keyframes searching-animation": {
      "0%": {
        borderColor: theme.palette.primary.main,
      },
      "50%": {
        borderColor: theme.palette.afesLight.main,
      },
      "100%": {
        borderColor: theme.palette.primary.main,
      },
    },
    loadingProgressWrapper: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      "& > *": {
        color: theme.palette.afesLight.main,
      },
    },
    scannerBackground: {
      background: "rgba(0, 0, 0, 0.7)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      "& > *": {
        display: "block",
        width: 64,
        height: 64,
        color: "#fff",
      },
    },
  })
);

export type QRScannerColors = ResultPopupColors;

export interface QRScannerProps {
  onScanFunc: (data: string | null) => void;
  videoStop: boolean;
  color?: QRScannerColors;
}

const QRScanner: React.FunctionComponent<QRScannerProps> = (props) => {
  const classes = useStyles();
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDialogTitle, setErrorDialogTitle] = useState("");
  const [errorDialogMessage, setErrorDialogMessage] = useState<string[]>([]);
  const [scannerStatus, setScannerStatus] = useState<
    "loading" | "waiting" | "error"
  >("loading");

  const getBorderClassName = (color: QRScannerColors | undefined): string => {
    switch (color) {
      case "success":
        return classes.borderSuccess;
      case "error":
        return classes.borderError;
      case "loading":
        return classes.borderLoading;
      default:
        return classes.borderSearching;
    }
  };

  const errorHandler = (err: unknown) => {
    console.error(err);
    setScannerStatus("error");
    setErrorDialogTitle("カメラ起動失敗");
    let reason: string[];
    if (isDOMException(err)) {
      console.error(err.name, err.message);
      switch (err.name) {
        case "NotReadableError":
          reason = [
            "カメラが他のアプリケーションで使用されています。",
            "カメラアプリやビデオ通話を開いていたり、フラッシュライトが点灯していませんか？",
          ];
          break;
        case "NotAllowedError":
          reason = [
            "カメラを使用する権限がありません。",
            "お使いのブラウザの設定を確認してください。",
          ];
          break;
        default:
          reason = ["原因不明のエラーです。"];
          break;
      }
      reason = [...reason, `[${err.name}]`, err.message];
      setErrorDialogMessage(reason);
    } else {
      setErrorDialogMessage(["原因不明のエラーです。"]);
    }
    setErrorDialogOpen(true);
  };

  return (
    <>
      <div className={classes.root}>
        {["loading", "error"].includes(scannerStatus) && (
          <div className={classes.scannerBackground}>
            {scannerStatus === "error" ? (
              <CameraOff />
            ) : (
              <CircularProgress size={64} />
            )}
          </div>
        )}
        <QrReader
          onScan={props.onScanFunc}
          onError={errorHandler}
          onLoad={() => {
            setScannerStatus("waiting");
          }}
          delay={props.videoStop ? false : 500}
          showViewFinder={false}
        />
        <div className={classes.shadowBox}>
          <div
            className={clsx(classes.borderBox, getBorderClassName(props.color))}
          />
        </div>
        <div className={classes.loadingProgressWrapper}>
          <Fade
            in={props.color === "loading"}
            timeout={{ enter: 500, exit: 0 }}
          >
            <CircularProgress size={64} />
          </Fade>
        </div>
      </div>
      <UniversalErrorDialog
        open={errorDialogOpen}
        title={errorDialogTitle}
        message={errorDialogMessage}
        onClose={() => {
          setErrorDialogOpen(false);
        }}
      />
    </>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isDOMException = (val: any): val is DOMException => {
  if (!val) return false;
  return (
    typeof val === "object" &&
    typeof val.name === "string" &&
    typeof val.message === "string"
  );
};

export default QRScanner;
