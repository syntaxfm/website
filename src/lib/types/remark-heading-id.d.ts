declare module "remark-heading-id" {
  import { Transformer } from "unified";
  type RemarkHeadingIdOptions = {
    defaults?: boolean;
    uniqueDefaults?: boolean;
  }
  function remarkHeadingId(options?: RemarkHeadingIdOptions): Transformer;
  export = remarkHeadingId;
}
