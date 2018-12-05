"use strict";

/**
 * A node in the flowchart
 *
 * @typedef {Object} FlowchartNode
 * @property {string} id
 * @property {string} text
 * @property {?FlowchartNodeLink[]} links
 */

/**
 * A link to another node in the flowchart
 *
 * @typedef {Object} FlowchartNodeLink
 * @property {string} text
 * @property {string} nodeId
 * @property {?string} linkExtraText
 */

console.log("Loading...");
Promise.all([fetch("flowchart.json").then(res => res.json()), domReady()]).then(
  ([flowchart]) => {
    console.log("Loaded data", flowchart);

    /**
     * @type {HTMLElement}
     */
    let containerElement = document.querySelector("ul.container");

    /**
     * @type {FlowchartNode[]}
     */
    let visitedNodes = [];

    // Global click event listener so we don't have to bind and remove from every link we create
    document.addEventListener("click", event => {
      if (event.target.classList.contains("node__link-button")) {
        event.preventDefault();
        handleNodeLinkClick(event.target.dataset.nodeId);
      } else if (event.target.classList.contains("node__back-button")) {
        event.preventDefault();
        handleBackLinkClick();
      }
    });

    // Start off with the entrypoint node
    moveToNewNode(flowchart.entrypoint);
    addNodeToView();

    /**
     * Update visitedNodes with the node object for the provided nodeId
     *
     * @param {string} nodeId
     */
    function moveToNewNode(nodeId) {
      console.log("moveToNewNode", { nodeId });
      let node = flowchart[nodeId];
      node.id = nodeId;
      visitedNodes = [...visitedNodes, node];
    }

    /**
     * Remove the last (most recent) node from visitedNodes
     */
    function moveToPreviousNode() {
      console.log("moveToPreviousNode");
      visitedNodes = visitedNodes.slice(0, -1);
    }

    /**
     * Build and add a new node element into the view
     */
    function addNodeToView() {
      console.log("addNodeToView", { visitedNodes });
      collapsePreviousNode();

      let currentNodeIndex = visitedNodes.length - 1;
      let currentNode = visitedNodes[currentNodeIndex];
      let currentNodeElement = document.createElement("li");
      currentNodeElement.className = "node node--current";
      currentNodeElement.dataset.id = currentNode.id;
      currentNodeElement.dataset.index = currentNodeIndex;

      let hasPreviousNode = visitedNodes.length > 1;
      let linkToCurrentNode;
      if (hasPreviousNode) {
        let previousNode = visitedNodes[currentNodeIndex - 1];
        linkToCurrentNode = previousNode.links.find(
          link => link.nodeId === currentNode.id
        );
        addSelectedLinkToPreviousNode(previousNode, linkToCurrentNode);
      }

      currentNodeElement.innerHTML = `
        <div class="node__text">${currentNode.text}</div>
        <div class="node__collapsible">
          ${
            linkToCurrentNode && linkToCurrentNode.linkExtraText
              ? `<div class="node__extra-text">${
                  linkToCurrentNode.linkExtraText
                }</div>`
              : ""
          }

          ${
            currentNode.links && currentNode.links.length
              ? `<ul class="node__links">
                  ${currentNode.links
                    .map(
                      link => `
                      <li class="node__link">
                        <a
                          href="#"
                          class="node__link-button button"
                          data-node-id="${link.nodeId}"
                        >⇨ ${link.text}</a>
                      </li>
                    `
                    )
                    .join("")}
                </ul>`
              : ""
          }

          ${
            hasPreviousNode
              ? `<a href="#" class="node__back-button button">⇦ Back</a>`
              : ""
          }
        </div>
      `;

      containerElement.appendChild(currentNodeElement);
    }

    /**
     * Remove the element for the given node from from the view
     *
     * @param {FlowchartNode} removedNode
     */
    function removeNodeFromView(removedNode) {
      console.log("removeNodeFromView", { removedNode, visitedNodes });
      containerElement.removeChild(
        containerElement.querySelector(`[data-id="${removedNode.id}"]`)
      );
      removeSelectedTextFromPreviousNode();
      uncollapsePreviousNode();
    }

    /**
     * Collapse the previous node element by removing the node--current class
     */
    function collapsePreviousNode() {
      console.log("collapsePreviousNode");
      let currentElement = containerElement.querySelector(".node--current");
      if (currentElement) {
        currentElement.classList.remove("node--current");
      }
    }

    /**
     * Uncollapse the previous node element by adding the node--curent class
     */
    function uncollapsePreviousNode() {
      console.log("uncollapsePreviousNode");
      let nodeElements = containerElement.querySelectorAll(".node");
      nodeElements[nodeElements.length - 1].classList.add("node--current");
    }

    /**
     * Add the text of the selected link to the previous node
     *
     * @param {FlowchartNode} previousNode
     * @param {FlowchartNodeLink} linkToCurrentNode
     */
    function addSelectedLinkToPreviousNode(previousNode, linkToCurrentNode) {
      let selectedLinkTextElement = document.createElement("div");
      selectedLinkTextElement.className = "node__selected-link-text";
      selectedLinkTextElement.innerText = `⇨ ${linkToCurrentNode.text}`;

      let previousNodeElement = containerElement.querySelector(
        `[data-id="${previousNode.id}"]`
      );
      let previousNodeTextElement = previousNodeElement.querySelector(
        `.node__text`
      );
      previousNodeElement.insertBefore(
        selectedLinkTextElement,
        previousNodeTextElement.nextSibling
      );
    }

    /**
     * Remove the text of the selected link from the previous node
     */
    function removeSelectedTextFromPreviousNode() {
      let nodeElements = containerElement.querySelectorAll(".node");
      let previousNodeElement = nodeElements[nodeElements.length - 1];
      let selectedTextElement = previousNodeElement.querySelector(
        ".node__selected-link-text"
      );
      previousNodeElement.removeChild(selectedTextElement);
    }

    /**
     * Handle clicking a node link
     * Update visitedNodes then add the new node element to the view
     *
     * @param {string} nodeId
     */
    function handleNodeLinkClick(nodeId) {
      console.log("handleNodeLinkClick", { nodeId });
      moveToNewNode(nodeId);
      addNodeToView();
    }

    /**
     * Handle clicking the back button
     * Remove the current node element from the view then update visitedNodes
     */
    function handleBackLinkClick() {
      console.log("handleBackLinkClick");
      removeNodeFromView(visitedNodes[visitedNodes.length - 1]);
      moveToPreviousNode();
    }
  }
);

/**
 * Simple Promise wrapper around the DOMContentLoaded event
 */
function domReady() {
  return new Promise(resolve => {
    if (document.readyState === "complete") return resolve();
    document.addEventListener("DOMContentLoaded", resolve);
  });
}
