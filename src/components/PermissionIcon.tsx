import React from "react";
import { Assignment, Room, Security, Settings } from "@material-ui/icons";
import { SvgIconProps } from "@material-ui/core";

const PermissionIcon: React.FC<{ permName: string } & SvgIconProps> = ({
  permName,
  ...iconProps
}) => {
  switch (permName) {
    case "admin":
      return <Security {...iconProps} />;
    case "reservation":
      return <Assignment {...iconProps} />;
    case "general":
      return <Settings {...iconProps} />;
    case "exhibition":
      return <Room {...iconProps} />;
    default:
      return null;
  }
};

export default PermissionIcon;