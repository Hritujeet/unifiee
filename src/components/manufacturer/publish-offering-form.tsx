import { FieldDescription, FieldLegend, FieldSet } from "@/components/ui/field";

export function PublishOfferingForm() {
  return (
    <FieldSet>
      <FieldLegend className="text-xl">Create a new offering</FieldLegend>
      <FieldDescription>
        This offering will be available to businesses.
      </FieldDescription>
    </FieldSet>
  );
}
