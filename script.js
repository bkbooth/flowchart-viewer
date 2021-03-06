"use strict";

/**
 * A node in the flowchart
 *
 * @typedef {Object} FlowchartNode
 * @property {string} id
 * @property {string} text
 * @property {string} linkedFromIndex
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

Promise.all([fetch("flowchart.json").then(res => res.json()), domReady()]).then(
  ([flowchart]) => {
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
        handleNodeLinkClick(
          event.target.dataset.nodeId,
          parseInt(event.target.dataset.linkIndex)
        );
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
     * @param {number} linkedFromIndex
     */
    function moveToNewNode(nodeId, linkedFromIndex) {
      let node = flowchart[nodeId];
      node.id = nodeId;
      node.linkedFromIndex = linkedFromIndex;
      visitedNodes = [...visitedNodes, node];
    }

    /**
     * Remove the last (most recent) node from visitedNodes
     */
    function moveToPreviousNode() {
      visitedNodes = visitedNodes.slice(0, -1);
    }

    /**
     * Build and add a new node element into the view
     */
    function addNodeToView() {
      collapsePreviousNode();

      let currentNodeIndex = visitedNodes.length - 1;
      let currentNode = visitedNodes[currentNodeIndex];
      let currentNodeElement = document.createElement("li");
      currentNodeElement.className = "node node--current show-start";
      currentNodeElement.dataset.id = currentNode.id;
      currentNodeElement.dataset.index = currentNodeIndex;

      let hasPreviousNode = visitedNodes.length > 1;
      let linkToCurrentNode;
      if (hasPreviousNode) {
        let previousNode = visitedNodes[currentNodeIndex - 1];
        linkToCurrentNode = previousNode.links[currentNode.linkedFromIndex];
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
                      (link, index) => `
                      <li class="node__link">
                        <a
                          href="#"
                          class="node__link-button button"
                          data-node-id="${link.nodeId}"
                          data-link-index="${index}"
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
      setTimeout(() => currentNodeElement.classList.remove("show-start"), 100);
    }

    /**
     * Remove the element for the given node from from the view
     *
     * @param {FlowchartNode} removedNode
     */
    function removeNodeFromView(removedNode) {
      let removedNodeElement = containerElement.querySelector(
        `[data-id="${removedNode.id}"]`
      );
      removedNodeElement.addEventListener("transitionend", event => {
        if (event.propertyName === "max-height") {
          containerElement.removeChild(removedNodeElement);
        }
      });
      removedNodeElement.classList.add("hide-start");
      removeSelectedTextFromPreviousNode();
      uncollapsePreviousNode();
    }

    /**
     * Collapse the previous node element by removing the node--current class
     */
    function collapsePreviousNode() {
      let currentElement = containerElement.querySelector(".node--current");
      if (currentElement) {
        currentElement.classList.remove("node--current");
      }
    }

    /**
     * Uncollapse the previous node element by adding the node--curent class
     */
    function uncollapsePreviousNode() {
      let nodeElements = containerElement.querySelectorAll(".node");
      nodeElements[nodeElements.length - 2].classList.add("node--current");
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
      let previousNodeElement = nodeElements[nodeElements.length - 2];
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
     * @param {number} linkIndex
     */
    function handleNodeLinkClick(nodeId, linkIndex) {
      moveToNewNode(nodeId, linkIndex);
      addNodeToView();
    }

    /**
     * Handle clicking the back button
     * Remove the current node element from the view then update visitedNodes
     */
    function handleBackLinkClick() {
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
