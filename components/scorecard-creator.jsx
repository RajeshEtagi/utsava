"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { X, Plus, Trophy, Trash2 } from "lucide-react";

export default function ScorecardCreator({ eventId, onScorecardCreated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState([
    { name: "", maxScore: 100, hasMaxScore: true, negativeMarking: false, description: "" },
  ]);

  const handleAddCategory = () => {
    setCategories([...categories, { name: "", maxScore: 100, hasMaxScore: true, negativeMarking: false, description: "" }]);
  };

  const handleRemoveCategory = (index) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (index, field, value) => {
    const updated = [...categories];
    updated[index][field] = value;
    setCategories(updated);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTitle("");
    setDescription("");
    setCategories([{ name: "", maxScore: 100, hasMaxScore: true, negativeMarking: false, description: "" }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (
      categories.some(
        (c) =>
          !c.name.trim() ||
          (c.hasMaxScore && (typeof c.maxScore !== "number" || c.maxScore <= 0)),
      )
    ) {
      toast.error("All categories need a name and max score > 0 when max score is enabled");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/scorecards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, title, description, categories }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || response.statusText || "Failed to create scorecard",
        );
      }

      const scorecard = await response.json();
      toast.success("Scorecard created!");
      handleClose();
      onScorecardCreated(scorecard);
    } catch (error) {
      toast.error(error.message || "Failed to create scorecard");
    } finally {
      setLoading(false);
    }
  };

  const totalMax = categories.reduce(
    (s, c) => s + (c.hasMaxScore ? parseInt(c.maxScore || 0) : 0),
    0
  );

  return (
    <div>
      <Button
        onClick={() => setIsOpen(true)}
        className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
      >
        <Plus className="w-4 h-4" />
        Create Scorecard
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-white/10 bg-background/95 shadow-2xl">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-purple-400" />
                  </div>
                  <h2 className="text-xl font-bold">Create Scorecard</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Best Team Performance, Innovation Award"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Description
                    <span className="text-muted-foreground font-normal ml-1 text-xs">
                      (optional)
                    </span>
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this scorecard evaluating?"
                    rows={2}
                  />
                </div>

                {/* Categories */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <label className="block text-sm font-medium">
                        Scoring Categories{" "}
                        <span className="text-red-400">*</span>
                      </label>
                      {totalMax > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Total max score:{" "}
                          <span className="text-purple-400 font-semibold">
                            {totalMax} pts
                          </span>
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddCategory}
                      variant="outline"
                      size="sm"
                      className="gap-1 h-8"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {categories.map((category, index) => (
                      <div
                        key={index}
                        className="flex gap-2 items-start p-3 rounded-xl bg-white/3 border border-white/10"
                      >
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold shrink-0 mt-1">
                          {index + 1}
                        </div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-2">
                            <Input
                              placeholder="Category name (e.g., Innovation)"
                              value={category.name}
                              onChange={(e) =>
                                handleCategoryChange(index, "name", e.target.value)
                              }
                              className="h-9"
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-xs text-muted-foreground flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={category.hasMaxScore}
                                onChange={(e) =>
                                  handleCategoryChange(index, "hasMaxScore", e.target.checked)
                                }
                                className="h-4 w-4 rounded border border-white/10 bg-background"
                              />
                              Has max score
                            </label>
                          </div>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              placeholder="Max"
                              value={category.maxScore}
                              onChange={(e) =>
                                handleCategoryChange(
                                  index,
                                  "maxScore",
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              min="1"
                              disabled={!category.hasMaxScore}
                              className="h-9"
                            />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              pts
                            </span>
                          </div>
                          <div className="sm:col-span-3">
                            <Input
                              placeholder="Description (optional)"
                              value={category.description}
                              onChange={(e) =>
                                handleCategoryChange(
                                  index,
                                  "description",
                                  e.target.value
                                )
                              }
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                        {categories.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCategory(index)}
                            className="text-muted-foreground hover:text-red-400 transition-colors mt-1 p-1 rounded-md hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        Create Scorecard
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
