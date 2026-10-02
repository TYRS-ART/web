"use client";

import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import { apiVersion, dataset, projectId } from "./src/sanity/env";
import { DuplicateNextWeekAction, RepeatWeeklyAction, withAutoSlug } from "./src/sanity/studio/actions";
import { schemaTypes, singletonTypes } from "./src/sanity/schemaTypes";
import { structure } from "./src/sanity/structure";

export default defineConfig({
  basePath: "/studio",
  title: "TYRŠ",
  projectId,
  dataset,
  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
  },
  document: {
    actions: (actions, { schemaType }) => {
      if (singletonTypes.has(schemaType)) {
        return actions.filter(({ action }) => action && ["publish", "discardChanges", "restore"].includes(action));
      }
      if (schemaType !== "event" && schemaType !== "course") return actions;
      // Publish fills in the URL slug automatically; events get weekly helpers.
      const withSlug = actions.map((action) => (action.action === "publish" ? withAutoSlug(action) : action));
      return schemaType === "event" ? [...withSlug, DuplicateNextWeekAction, RepeatWeeklyAction] : withSlug;
    },
  },
  plugins: [structureTool({ structure }), visionTool({ defaultApiVersion: apiVersion })],
});
