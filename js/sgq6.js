/*global _config*/

var SGQ6 = window.SGQ6 || {};

(function rideScopeWrapper($) {
    var authToken;
    SGQ6.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
        } else {
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        alert(error);
        window.location.href = '/signin.html';
    });

    function sendKPI() {
        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/kpi-post',
            headers: {
                Authorization: authToken
            },
            data: JSON.stringify({
                KPI: {
                    p1: $('#param1').val(),
                    p2: $('#param2').val(),
                    p3: $('#param3').val(),
                    p4: $('#param4').val(),
                    p5: $('#param5').val(),
                    p6: $('#param6').val(),
                    p7: $('#param7').val(),
                    p8: $('#param8').val(),
                    p9: $('#param9').val(),
                    p10: $('#param10').val(),
                }
            }),
            contentType: 'application/json',
            success: completeRequest,
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                //alert('Error requesting: ', textStatus, ', Details: ', errorThrown);
                //alert('Response: ', jqXHR.responseText);
                alert('Um erro ocorreu na requisição:\n' + jqXHR.responseText);
            }
        });
    }

    function completeRequest(result) {        
        displayUpdate('KPI 1: ' + result.KPI1 + ' | KPI 2: ' + result.KPI2 + ' | KPI 3: ' + result.KPI3 + ' | KPI 4: ' + result.KPI4 + ' | KPI 5: ' + result.KPI5 + ' | KPI 6: ' + result.KPI6 + ' | KPI 7: ' + result.KPI7);  
    }

    // Register click handler for #request button
    $(function onDocReady() {
        $('#request').click(handleRequestClick);
        $('#signOut').click(function() {
            SGQ6.signOut();
            alert("Voce foi deslogado.");
            window.location = "signin.html";
        });

        if (!_config.api.invokeUrl) {
            $('#noApiMessage').show();
        }

        $('#auth').click(function () {
            displayUpdate(authToken);
        });
    });

    function handleRequestClick(event) {
        event.preventDefault();        
        sendKPI();         
    }

    function displayUpdate(text) {
        $('#updates').append($('<li>' + text + '</li>'));
    }
}(jQuery));
