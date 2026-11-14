// src/components/EditItem/FilePicker.tsx
import React from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "react-beautiful-dnd";
import { pb } from "../../pocketbaseClient";

interface FileReorderProps {
  files: (File | string)[];
  onReorder: (newFiles: (File | string)[]) => void;
  itemRef?: any;
}

export const FileReorder: React.FC<FileReorderProps> = ({ files, onReorder, itemRef }) => {
  const handleDragEnd = (res: DropResult) => {
    if (!res.destination) return;
    const next = Array.from(files);
    const [moved] = next.splice(res.source.index, 1);
    next.splice(res.destination.index, 0, moved);
    onReorder(next);
  };

  const getFileName = (f: File | string) => (typeof f === "string" ? f : f.name);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="files" direction="vertical">
        {(prov) => (
          <ul
            ref={prov.innerRef}
            {...prov.droppableProps}
            style={{ listStyle: "none", padding: 0, margin: 0 }}
          >
            {files.map((f, i) => {
              const id = getFileName(f) + i;
              const isString = typeof f === "string";

              let previewUrl = "";
              if (isString && itemRef) {
                previewUrl = f.startsWith("http")
                  ? f
                  : pb.files.getURL(itemRef, f, { thumb: "100x100" });
              } else if (!isString) {
                previewUrl = URL.createObjectURL(f as File);
              }

              return (
                <Draggable key={id} draggableId={id} index={i}>
                  {(p) => (
                    <li
                      ref={p.innerRef}
                      {...p.draggableProps}
                      {...p.dragHandleProps}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "8px 10px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        marginBottom: "8px",
                        background: "#ffffff",
                        gap: "12px",
                        ...p.draggableProps.style,
                      }}
                    >
                      {previewUrl && (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          style={{
                            width: 44,
                            height: 44,
                            objectFit: "cover",
                            borderRadius: "6px",
                            border: "1px solid #e2e8f0",
                          }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#1e293b",
                          }}
                        >
                          {i === 0 && (
                            <span
                              style={{
                                background: "#dbeafe",
                                color: "#1d4ed8",
                                fontSize: "10px",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                marginRight: "6px",
                              }}
                            >
                              COVER
                            </span>
                          )}
                          {getFileName(f)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const next = Array.from(files);
                          next.splice(i, 1);
                          onReorder(next);
                        }}
                        style={{
                          background: "#fef2f2",
                          color: "#ef4444",
                          border: "1px solid #fecaca",
                          borderRadius: "6px",
                          cursor: "pointer",
                          padding: "4px 8px",
                          fontWeight: "bold",
                        }}
                        title="Remove photo"
                      >
                        ✕
                      </button>

                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (i === 0) return;
                            const next = Array.from(files);
                            [next[i - 1], next[i]] = [next[i], next[i - 1]];
                            onReorder(next);
                          }}
                          disabled={i === 0}
                          style={{ fontSize: "11px", cursor: i === 0 ? "not-allowed" : "pointer" }}
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (i === files.length - 1) return;
                            const next = Array.from(files);
                            [next[i + 1], next[i]] = [next[i], next[i + 1]];
                            onReorder(next);
                          }}
                          disabled={i === files.length - 1}
                          style={{
                            fontSize: "11px",
                            cursor: i === files.length - 1 ? "not-allowed" : "pointer",
                          }}
                        >
                          ▼
                        </button>
                      </div>
                    </li>
                  )}
                </Draggable>
              );
            })}
            {prov.placeholder}
          </ul>
        )}
      </Droppable>
    </DragDropContext>
  );
};