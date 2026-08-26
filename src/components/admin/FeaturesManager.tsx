'use client';

import { useState } from 'react';
import { Plus, X, Check, GripVertical } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FeaturesManagerProps {
    initialFeatures?: string[];
    onChange?: (features: string[]) => void;
}

interface FeatureItem {
    id: string;
    text: string;
}

function SortableFeatureItem({
    item,
    index,
    onRemove,
}: {
    item: FeatureItem;
    index: number;
    onRemove: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-2.5 p-3 bg-green-50 border border-green-200 rounded-xl group hover:bg-green-100/80 transition-colors select-none relative ${
                isDragging ? 'opacity-30 border-dashed border-green-500 scale-[0.98]' : 'shadow-2xs'
            }`}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1.5 -m-1 text-gray-400 hover:text-green-700 active:text-green-800 rounded-lg hover:bg-green-200/60 transition-colors touch-none flex items-center justify-center shrink-0"
                title="برای تغییر ترتیب بکشید و رها کنید (Drag & Drop)"
            >
                <GripVertical className="w-4 h-4" />
            </div>

            {/* Checkmark */}
            <Check className="w-4 h-4 text-green-600 shrink-0" />

            {/* Feature Text */}
            <span className="flex-1 text-sm font-medium text-gray-800 leading-snug break-words">
                {item.text}
            </span>

            {/* Position Badge */}
            <span className="w-5 h-5 rounded-md bg-green text-gray-600 text-[11px] font-bold font-mono flex items-center justify-center border border-gray-200 shadow-2xs group-hover:border-green-300 group-hover:text-green-700 transition-colors shrink-0">
                {index + 1}
            </span>

            {/* Remove Button */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 -m-1 hover:bg-red-100 text-gray-400 hover:text-red-600 rounded-lg transition-all cursor-pointer shrink-0"
                title="حذف ویژگی"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

function DragOverlayItem({ item, index }: { item: FeatureItem; index: number }) {
    return (
        <div className="flex items-center gap-2.5 p-3 bg-green-100/95 border-2 border-green-500 rounded-xl shadow-xl scale-[1.02] cursor-grabbing select-none">
            <div className="p-1.5 -m-1 text-green-800 flex items-center justify-center shrink-0">
                <GripVertical className="w-4 h-4" />
            </div>
            <Check className="w-4 h-4 text-green-600 shrink-0" />
            <span className="flex-1 text-sm font-medium text-gray-900 leading-snug break-words">
                {item.text}
            </span>
            <span className="w-5 h-5 rounded-full bg-white text-green-800 text-[11px] font-bold font-mono flex items-center justify-center border border-green-400 shadow-xs shrink-0">
                {index + 1}
            </span>
        </div>
    );
}

export default function FeaturesManager({ initialFeatures = [], onChange }: FeaturesManagerProps) {
    const [items, setItems] = useState<FeatureItem[]>(() =>
        initialFeatures.map((text, idx) => ({
            id: `feat-${idx}-${text}`,
            text,
        }))
    );
    const [activeId, setActiveId] = useState<string | null>(null);
    const [newFeature, setNewFeature] = useState('');
    const [prevInitialFeatures, setPrevInitialFeatures] = useState<string[]>(initialFeatures);

    // Keep in sync when initialFeatures changes externally (recommended React pattern)
    if (
        prevInitialFeatures.length !== initialFeatures.length ||
        !prevInitialFeatures.every((val, idx) => val === initialFeatures[idx])
    ) {
        setPrevInitialFeatures(initialFeatures);
        setItems(
            initialFeatures.map((text, idx) => ({
                id: `feat-${idx}-${text}`,
                text,
            }))
        );
    }

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3, // 3px movement starts smooth drag
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const addFeature = () => {
        const trimmed = newFeature.trim();
        if (trimmed && !items.some((it) => it.text === trimmed)) {
            const newItem: FeatureItem = {
                id: `feat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                text: trimmed,
            };
            const updated = [...items, newItem];
            setItems(updated);
            onChange?.(updated.map((it) => it.text));
            setNewFeature('');
        }
    };

    const removeFeature = (id: string) => {
        const updated = items.filter((it) => it.id !== id);
        setItems(updated);
        onChange?.(updated.map((it) => it.text));
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            setItems((currentItems) => {
                const oldIndex = currentItems.findIndex((it) => it.id === active.id);
                const newIndex = currentItems.findIndex((it) => it.id === over.id);
                if (oldIndex !== -1 && newIndex !== -1) {
                    const reordered = arrayMove(currentItems, oldIndex, newIndex);
                    onChange?.(reordered.map((it) => it.text));
                    return reordered;
                }
                return currentItems;
            });
        }
    };

    const activeItem = activeId ? items.find((it) => it.id === activeId) : null;
    const activeIndex = activeItem ? items.findIndex((it) => it.id === activeId) : -1;

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
                ویژگی‌های محصول
            </label>

            {/* Draggable Feature List */}
            {items.length > 0 && (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={items.map((it) => it.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-2">
                            {items.map((item, index) => (
                                <SortableFeatureItem
                                    key={item.id}
                                    item={item}
                                    index={index}
                                    onRemove={removeFeature}
                                />
                            ))}
                        </div>
                    </SortableContext>

                    <DragOverlay>
                        {activeItem && activeIndex !== -1 ? (
                            <DragOverlayItem item={activeItem} index={activeIndex} />
                        ) : null}
                    </DragOverlay>
                </DndContext>
            )}

            {/* Add New Feature */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addFeature();
                        }
                    }}
                    placeholder="مثال: تیغه استیل ضدزنگ یا گارانتی ۱۸ ماهه"
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-green-100 focus:bg-white focus:border-green-300 transition-all outline-none text-gray-800"
                />
                <button
                    type="button"
                    onClick={addFeature}
                    disabled={!newFeature.trim()}
                    className="px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors flex items-center gap-2 cursor-pointer shrink-0"
                >
                    <Plus className="w-5 h-5" />
                    افزودن
                </button>
            </div>

            <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <span>💡</span>
                <span>می‌توانید با کشیدن آیکون دستگیره (یا هر آیتم)، ویژگی‌ها را از پایین به بالا یا بالعکس جابجا کنید.</span>
            </p>

            {/* Hidden input to submit features with standard form submissions */}
            <input
                type="hidden"
                name="features"
                value={JSON.stringify(items.map((it) => it.text))}
            />
        </div>
    );
}
