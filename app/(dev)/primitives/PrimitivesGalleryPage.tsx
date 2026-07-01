// primitives/PrimitivesGalleryPage.tsx

"use client";

import { ButtonsSection } from "./sections/ButtonsSection";
import { InputsSection } from "./sections/InputsSection";
import { TogglesSection } from "./sections/TogglesSection";
import { SelectsSection } from "./sections/SelectsSection";
import { TextareasSection } from "./sections/TextareasSection";
import { RadioTilesSection } from "./sections/RadioTilesSection";

export default function PrimitivesGalleryPage() {
    return (
        <div className="min-h-dvh bg-(--bg) text-(--text)">
            <div className="mx-auto max-w-6xl px-6 py-10 space-y-4">
                <ButtonsSection />
                <InputsSection />
                <TogglesSection />
                <SelectsSection />
                <TextareasSection />
                <RadioTilesSection />
            </div>
        </div>
    );
}
