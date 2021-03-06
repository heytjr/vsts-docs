var apiwriter = require('apiwriter');

exports.getContext = function() {
    return {
        repositoryId: null,
        objectId: null,
    };
};

exports.submitRequests = function()
{
    apiwriter.setEnableWrite(false);

    apiwriter.getJson('/git/repositories',
        function(context, result) {
            context.repositoryId = result.responseBody.value[0].id;
        });

    //find a tree under the root and get its sha1
    apiwriter.getJson('/git/repositories/{repositoryId}/items?scopePath=/MyWebSite/MyWebSite/Views',
        function(context, result) {
			//get items from request
			var items = result.responseBody.value;
			//pick the first non-root tree
			for (var i = 0 ; i < items.length ; i++)
			{
				if (items[i].gitObjectType == "tree" && items[i].path != "/")
				{
					context.objectId = items[i].objectId;
					break;
				}
			}
        });

    apiwriter.setEnableWrite(true);

    apiwriter.getJson('/git/repositories/{repositoryId}/trees/{objectId}');

    apiwriter.getJson('/git/repositories/{repositoryId}/trees/{objectId}?recursive=true');
}
