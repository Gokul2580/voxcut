import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Film, Clock, MoreVertical, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProjectCard({ project, onDelete }) {
  return (
    <Link
      to={createPageUrl(`Editor?projectId=${project.id}`)}
      className="group block"
    >
      <div className="rounded-xl border border-border/50 bg-card hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300 overflow-hidden">
        <div className="aspect-video bg-gradient-to-br from-violet-500/10 to-blue-500/10 flex items-center justify-center relative">
          {project.thumbnail_url ? (
            <img src={project.thumbnail_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Film className="w-10 h-10 text-violet-400/40 group-hover:text-violet-400/60 transition-colors" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
          <div className="absolute top-2 right-2" onClick={(e) => e.preventDefault()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-7 h-7 rounded-md bg-black/40 hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-3.5 h-3.5 text-white" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete(project.id);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-sm truncate group-hover:text-violet-300 transition-colors">
            {project.name}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              project.status === "completed" ? "bg-green-500/15 text-green-400" :
              project.status === "editing" ? "bg-violet-500/15 text-violet-400" :
              project.status === "rendering" ? "bg-amber-500/15 text-amber-400" :
              "bg-secondary text-muted-foreground"
            }`}>
              {project.status || "draft"}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {project.created_date ? format(new Date(project.created_date), "MMM d") : ""}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}