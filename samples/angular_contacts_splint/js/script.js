$(document).on("mouseenter", ".list-group-item", function() {
  $(this).css("border-right", "5px solid firebrick");
}).on("mouseleave", ".list-group-item", function() {
  $(this).css("border-right", "");
});
