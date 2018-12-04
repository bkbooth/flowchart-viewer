"use strict";

console.log("Loading...");
Promise.all([fetch("flowchart.json").then(res => res.json()), domReady()]).then(
  ([flowchart]) => {
    console.log("Loaded data", flowchart);

    let containerElement = document.querySelector("ul.container");
    let visitedNodes = moveToNewNode(flowchart.entrypoint, []);
    addNodeToView(visitedNodes);

    function moveToNewNode(nodeId, visitedNodes) {
      console.log("moveToNewNode", { nodeId, visitedNodes });
      let node = flowchart[nodeId];
      node.id = nodeId;
      return [...visitedNodes, node];
    }

    function moveToPreviousNode(visitedNodes) {
      return visitedNodes.slice(-1);
    }

    function addNodeToView(visitedNodes) {
      console.log("addNodeToView", visitedNodes);
      collapsePreviousNode();

      let currentNodeIndex = visitedNodes.length - 1;
      let currentNode = visitedNodes[currentNodeIndex];
      let currentNodeElement = document.createElement("li");
      currentNodeElement.className = "node node--current";
      currentNodeElement.dataset.id = currentNode.id;
      currentNodeElement.dataset.index = currentNodeIndex;

      let textElement = document.createElement("p");
      textElement.innerText = currentNode.text;
      textElement.className = "node__text";
      currentNodeElement.appendChild(textElement);

      let collapsibleWrapperElement = document.createElement("div");
      collapsibleWrapperElement.className = "node__collapsible";

      let hasPreviousNode = visitedNodes.length > 1;
      if (hasPreviousNode) {
        let previousNode = visitedNodes[currentNodeIndex - 1];
        let linkToCurrentNode = previousNode.links.find(
          link => link.nodeId === currentNode.id
        );
        if (linkToCurrentNode && linkToCurrentNode.linkExtraText) {
          let textElement = document.createElement("p");
          textElement.innerText = linkToCurrentNode.linkExtraText;
          textElement.className = "node__extra-text";
          collapsibleWrapperElement.appendChild(textElement);
        }
      }

      if (currentNode.links && currentNode.links.length) {
        let listElement = document.createElement("ul");
        listElement.className = "node__links";

        currentNode.links.forEach(link => {
          let listItemElement = document.createElement("li");
          listItemElement.className = "node__link";

          let linkElement = document.createElement("a");
          linkElement.innerText = link.text;
          linkElement.href = "#";
          linkElement.className = "node__link-button";
          linkElement.dataset.nodeId = link.nodeId;
          linkElement.addEventListener("click", event =>
            handleNodeLinkClick(event, visitedNodes)
          );

          listItemElement.appendChild(linkElement);
          listElement.appendChild(listItemElement);
        });

        collapsibleWrapperElement.appendChild(listElement);
      }

      if (hasPreviousNode) {
        let textElement = document.createElement("p");

        let linkElement = document.createElement("a");
        linkElement.innerText = "Back";
        linkElement.href = "#";
        linkElement.className = "node__back-button";
        linkElement.addEventListener("click", () =>
          handleBackLinkClick(visitedNodes)
        );

        textElement.appendChild(linkElement);
        collapsibleWrapperElement.appendChild(textElement);
      }

      currentNodeElement.appendChild(collapsibleWrapperElement);
      containerElement.appendChild(currentNodeElement);
    }

    function removeNodeFromView(removedNode, visitedNodes) {
      console.log("removeNodeFromView", { removedNode, visitedNodes });
      containerElement.removeChild(
        containerElement.querySelector(`[data-id="${removedNode.id}"]`)
      );
      uncollapsePreviousNode();
    }

    function collapsePreviousNode() {
      console.log("collapsePreviousNode");
      let currentElement = containerElement.querySelector(".node--current");
      if (currentElement) {
        currentElement.classList.remove("node--current");
      }
    }

    function uncollapsePreviousNode() {
      console.log("uncollapsePreviousNode");
      let nodeElements = containerElement.querySelectorAll(".node");
      nodeElements[nodeElements.length - 1].classList.add("node--current");
    }

    function handleNodeLinkClick(event, visitedNodes) {
      console.log("handleNodeLinkClick", { event, visitedNodes });
      event.preventDefault();
      let newVisitedNodes = moveToNewNode(
        event.target.dataset.nodeId,
        visitedNodes
      );
      addNodeToView(newVisitedNodes);
    }

    function handleBackLinkClick(visitedNodes) {
      console.log("handleBackLinkClick", { visitedNodes });
      event.preventDefault();
      let newVisitedNodes = moveToPreviousNode(visitedNodes);
      removeNodeFromView(
        visitedNodes[visitedNodes.length - 1],
        newVisitedNodes
      );
    }
  }
);

function domReady() {
  return new Promise(resolve => {
    if (document.readyState === "complete") return resolve();
    document.addEventListener("DOMContentLoaded", resolve);
  });
}
