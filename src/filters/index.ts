import { SwiftFilter } from "./swift_filter";
import { FlutterFilter } from "./flutter_filter";
import { KotlinFilter } from "./kotlin_filter";
import { ReactFilter } from "./react_filter";
import { NextjsFilter } from "./nextjs_filter";

export { SwiftFilter, FlutterFilter, KotlinFilter, ReactFilter, NextjsFilter };

export function getFilterForTechnology(technology: string) {
  switch (technology.toLowerCase()) {
    case "swift":
      return SwiftFilter;
    case "flutter":
      return FlutterFilter;
    case "kotlin":
      return KotlinFilter;
    case "react":
    case "react-native":
      return ReactFilter;
    case "nextjs":
      return NextjsFilter;
    default:
      return null;
  }
}
