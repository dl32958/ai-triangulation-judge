from __future__ import annotations

import time

from langgraph.graph import END, START, StateGraph

from app.config import get_annotated_output_dir, get_debug_output_dir
from app.pipeline.nodes import (
    constraints_and_extraction_engine_a_node,
    constraints_and_extraction_engine_b_node,
    eval_block_node,
    finalize_node,
    ocr_node,
    visualize_node,
)
from app.pipeline.state import PipelineState, build_initial_state


def build_graph():
    graph = StateGraph(PipelineState)
    graph.add_node("ocr", ocr_node)
    graph.add_node("constraints_and_extraction_engineA", constraints_and_extraction_engine_a_node)
    graph.add_node("constraints_and_extraction_engineB", constraints_and_extraction_engine_b_node)
    graph.add_node("eval_block", eval_block_node)
    graph.add_node("visualize", visualize_node)
    graph.add_node("finalize", finalize_node)

    # Keep the workflow strictly sequential for single GPU execution pattern.
    graph.add_edge(START, "ocr")
    graph.add_edge("ocr", "constraints_and_extraction_engineA")
    graph.add_edge("constraints_and_extraction_engineA", "constraints_and_extraction_engineB")
    graph.add_edge("constraints_and_extraction_engineB", "eval_block")
    graph.add_edge("eval_block", "visualize")
    graph.add_edge("visualize", "finalize")
    graph.add_edge("finalize", END)
    return graph.compile()


def run_pipeline_graph(
    image_path: str,
    doc_category: str,
    fields: list[str],
    debug: bool,
    output_dir: str | None = None,
    annotated_output_dir: str | None = None,
    run_ts: str | None = None,
):
    app = build_graph()
    if output_dir is None:
        output_dir = str(get_debug_output_dir())
    if annotated_output_dir is None:
        annotated_output_dir = str(get_annotated_output_dir())
    state = build_initial_state(
        image_path,
        doc_category,
        fields,
        debug,
        output_dir,
        annotated_output_dir,
    )
    state["run_metadata"] = {
        "pipeline_start": time.time(),
        "run_ts": run_ts,
    }
    final_state = app.invoke(state)
    return final_state["final_result"]
